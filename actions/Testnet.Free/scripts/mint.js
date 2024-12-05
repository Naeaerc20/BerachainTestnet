// BerachainTestnet/actions/Testnet.Free/scripts/mint.js

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const {
  MINT_CONTRACT_ADDRESS,
  MINT_CONTRACT_ABI,
  RPC_URL,
  TX_EXPLORER
} = require('../ABI.js');

/**
 * Lee y parsea el archivo wallets.json.
 * @returns {Array} Array de wallets.
 */
function getWallets() {
  const walletsPath = path.join(__dirname, '../../../wallets.json');
  try {
    const data = fs.readFileSync(walletsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error leyendo wallets.json:', error.message);
    process.exit(1);
  }
}

/**
 * Retorna una promesa que se resuelve después de ms milisegundos.
 * @param {number} ms - Milisegundos a esperar.
 * @returns {Promise}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retorna un gas limit aleatorio entre 100000 y 180000.
 * @returns {number}
 */
function getRandomGasLimit() {
  return Math.floor(Math.random() * (180000 - 100000 + 1)) + 100000;
}

/**
 * Función principal para realizar el minting de NFTs.
 */
async function mintNFTs() {
  const wallets = getWallets();
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

  for (const wallet of wallets) {
    const { wallet: walletAddress, privateKey } = wallet;
    const walletInstance = new ethers.Wallet(privateKey, provider);

    try {
      // Verificar balance
      const balance = await provider.getBalance(walletAddress);
      const balanceInBera = parseFloat(ethers.utils.formatEther(balance));

      if (balanceInBera < 0.012) {
        console.log(`🔴 Wallet Address ['${walletAddress}'] It's skipped for unavailability Funds Balance ['${balanceInBera.toFixed(3)}']`);
        continue;
      }

      console.log(`🔵 Wallet Address ['${walletAddress}'] is Minting 1 NFT(s)`);

      // Crear instancia del contrato
      const mintContract = new ethers.Contract(MINT_CONTRACT_ADDRESS, MINT_CONTRACT_ABI, walletInstance);

      // Preparar la transacción
      const tx = await mintContract.purchase(1, {
        value: ethers.utils.parseEther("0.010001"),
        gasLimit: getRandomGasLimit(),
        maxPriorityFeePerGas: ethers.utils.parseUnits('1', 'gwei'),
        maxFeePerGas: ethers.utils.parseUnits('1', 'gwei')
      });

      console.log(`🟢 Tx Mint Hash: ${TX_EXPLORER}${tx.hash}`);

      // Esperar la confirmación
      const receipt = await tx.wait();

      console.log(`📦 Tx Confirmed in Block Number: ['${receipt.blockNumber}']`);

    } catch (error) {
      if (error.code === 'CALL_EXCEPTION') {
        console.log(`❌ Transaction failed for Wallet ['${walletAddress}'] due to a contract call exception.`);
      } else {
        console.log(`❌ An error occurred for Wallet ['${walletAddress}']: ${error.message}`);
      }
    }

    // Esperar 1 segundo antes de procesar el siguiente wallet
    await delay(1000);
  }
}

module.exports = mintNFTs;
