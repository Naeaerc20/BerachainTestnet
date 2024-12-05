// scripts/swap.js

const { ethers } = require('ethers');
const dotenv = require('dotenv');
const axios = require('axios'); // Importar Axios para solicitudes HTTP
const {
  KODIAK_ROUTER_ADDRESS,
  SECONDARY_ABI,
  PRIMATY_ABI,
  WBERA_CONTRACT_ADDRESS,
  YEET_CONTRACT_ADDRESS,
  RPC_URLS,
  CHAIN_ID,
  TX_EXPLORER,
  ERC20_ABI
} = require('../ABI.js');

// Cargar variables de entorno desde el archivo .env ubicado en scripts
dotenv.config();

// Extraer detalles de la billetera desde las variables de entorno
const WALLET_ADDRESS = process.env.WALLET_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Validar variables de entorno
if (!WALLET_ADDRESS || !PRIVATE_KEY) {
  console.error('Error: WALLET_ADDRESS y PRIVATE_KEY deben estar configurados en el archivo .env.');
  process.exit(1);
}

// Inicializar el proveedor
const provider = new ethers.providers.JsonRpcProvider(RPC_URLS[0]);

// Inicializar la billetera
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Inicializar instancias de contrato para WBERA y YEET para obtener balances
const wberaContract = new ethers.Contract(WBERA_CONTRACT_ADDRESS, ERC20_ABI, provider);
const yeetContract = new ethers.Contract(YEET_CONTRACT_ADDRESS, ERC20_ABI, provider);

// Inicializar instancia de contrato para el Router
const routerContract = new ethers.Contract(KODIAK_ROUTER_ADDRESS, PRIMATY_ABI, wallet);

// Función para obtener la cotización desde la API de Quote
async function getQuote(tokenA, tokenB, amount) {
  const url = `https://ebey72gfe6.execute-api.us-east-1.amazonaws.com/prod/quote?protocols=v2%2Cv3%2Cmixed&tokenInAddress=${tokenA}&tokenInChainId=80084&tokenOutAddress=${tokenB}&tokenOutChainId=80084&amount=${amount}&type=exactIn`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      }
    });
    
    console.log('Respuesta completa de la API de Quote:', response.data); // Log completo de la respuesta
    
    if (response.status === 200) {
      console.log('Respuesta de la API de Quote recibida.');
      return response.data;
    } else {
      throw new Error(`Error en la API de Quote: Estado ${response.status}`);
    }
  } catch (error) {
    console.error('Error al obtener la cotización:', error.message);
    throw error;
  }
}

// Función para obtener previousBlockHash como bytes32 vacío
function getEmptyPreviousBlockHash() {
  return ethers.constants.HashZero; // 0x000...0000 (32 bytes)
}

// Función principal para realizar el swap
async function performSwap() {
  try {
    // 1. Obtener balance de BERA (token nativo)
    const beraBalance = await provider.getBalance(WALLET_ADDRESS);
    console.log(`BERA Balance: ${ethers.utils.formatEther(beraBalance)} BERA`);

    // 2. Obtener balances de WBERA y YEET
    const wberaBalance = await wberaContract.balanceOf(WALLET_ADDRESS);
    console.log(`WBERA Balance: ${ethers.utils.formatUnits(wberaBalance, 18)} WBERA`);

    const yeetBalance = await yeetContract.balanceOf(WALLET_ADDRESS);
    console.log(`YEET Balance: ${ethers.utils.formatUnits(yeetBalance, 18)} YEET`);

    // 3. Calcular el 20% del balance de BERA y truncarlo a 4 decimales
    const beraBalanceFormatted = parseFloat(ethers.utils.formatEther(beraBalance));
    const amountInBERA = parseFloat((beraBalanceFormatted * 0.20).toFixed(4)); // 4 decimales
    const amountInWei = ethers.utils.parseEther(amountInBERA.toFixed(4)); // Convertir a wei
    console.log(`Amount In (20%): ${ethers.utils.formatEther(amountInWei)} BERA`);

    // 4. Obtener cotización desde la API de Quote
    const quoteResponse = await getQuote(
      WBERA_CONTRACT_ADDRESS,
      YEET_CONTRACT_ADDRESS,
      amountInWei.toString()
    );

    // Verificar si 'amount' y 'quote' existen en la respuesta
    if (!quoteResponse.amount || !quoteResponse.quote) {
      throw new Error('Los campos amount y quote no están presentes en la respuesta de la API de Quote.');
    }

    const amountIn = quoteResponse.amount; // "amount" del response (WBERA)
    const amountOut = quoteResponse.quote; // "quote" del response (YEET)
    console.log(`API Quote - Amount In: ${amountIn} WBERA`);
    console.log(`API Quote - Amount Out: ${amountOut} YEET`);

    // 5. Encapsular swapExactTokensForTokens usando SECONDARY_ABI
    const secondaryInterface = new ethers.utils.Interface(SECONDARY_ABI);
    const swapData = secondaryInterface.encodeFunctionData('swapExactTokensForTokens', [
      ethers.BigNumber.from(amountIn), // amountIn como uint256 (WBERA)
      ethers.BigNumber.from(amountOut).mul(99).div(100), // amountOutMin como uint256 (99% de amountOut)
      [WBERA_CONTRACT_ADDRESS, YEET_CONTRACT_ADDRESS], // path como address[]
      WALLET_ADDRESS // to como address
    ]);

    console.log('Encapsulated swapExactTokensForTokens data (Bytes):');
    console.log(swapData);

    // 6. Establecer previousBlockHash como bytes32 vacío
    const previousBlockHash = getEmptyPreviousBlockHash();
    console.log(`previousBlockHash establecido como vacío: ${previousBlockHash}`);

    // 7. Encapsular swapData en multicall usando PRIMATY_ABI
    const dataArray = [swapData];
    const multicallParams = [previousBlockHash, dataArray];

    // Codificar bytes32 y bytes[] sin el Method ID
    const encodedMulticallParams = ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'bytes[]'],
      multicallParams
    );

    console.log('Encoded multicall parameters (bytes32 + bytes[]):');
    console.log(encodedMulticallParams);

    // 8. Seleccionar el Method ID para multicall
    const multicallSelector = '0x5ae401dc';

    // 9. Formar los datos finales de la transacción: MethodID + bytes32 + bytes
    const finalData = multicallSelector + encodedMulticallParams.slice(2);
    console.log('Final transaction data (MethodID + Encapsulated Data):');
    console.log(finalData);

    // 10. Obtener baseFee del último bloque
    const latestBlock = await provider.getBlock('latest');
    const baseFee = latestBlock.baseFeePerGas;
    if (!baseFee) {
      throw new Error('Unable to fetch baseFee from the latest block.');
    }
    console.log(`Base Fee Per Gas: ${baseFee.toString()} wei`);

    // 11. Calcular maxFeePerGas y maxPriorityFeePerGas
    const maxFeePerGas = baseFee.mul(105).div(100); // baseFee + 5%
    const maxPriorityFeePerGas = baseFee.mul(5).div(100); // 5% de baseFee
    console.log(`Max Fee Per Gas: ${maxFeePerGas.toString()} wei`);
    console.log(`Max Priority Fee Per Gas: ${maxPriorityFeePerGas.toString()} wei`);

    // 12. Generar gasLimit aleatorio entre 250,000 y 350,000
    const gasLimitValue = Math.floor(Math.random() * (350000 - 250000 + 1)) + 250000;
    const gasLimit = ethers.BigNumber.from(gasLimitValue);
    console.log(`Gas Limit: ${gasLimit.toString()}`);

    // 13. Preparar la transacción
    const tx = {
      to: KODIAK_ROUTER_ADDRESS,
      data: finalData,
      value: amountInWei, // Enviar BERA como valor nativo
      gasLimit: gasLimit,
      maxFeePerGas: maxFeePerGas,
      maxPriorityFeePerGas: maxPriorityFeePerGas,
      type: 2, // EIP-1559
      chainId: CHAIN_ID
    };

    console.log('Sending transaction...');

    // 14. Enviar la transacción
    const transactionResponse = await wallet.sendTransaction(tx);
    console.log(`Transaction sent. Hash: ${TX_EXPLORER}${transactionResponse.hash}`);

    // 15. Esperar confirmación
    const receipt = await transactionResponse.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}.`);
  } catch (error) {
    if (error.code === 'CALL_EXCEPTION') {
      console.error('Call exception occurred during the transaction.');
    } else {
      console.error('An error occurred:', error.message);
    }
  }
}

// Ejecutar la función directamente
performSwap();
