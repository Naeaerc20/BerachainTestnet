// scripts/swap.js

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const readline = require('readline-sync');
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

// Path to wallets.json
const walletsPath = path.join(__dirname, '../../wallets.json');

// Check if wallets.json exists
if (!fs.existsSync(walletsPath)) {
  console.error('❌ Error: wallets.json not found at the specified path.');
  process.exit(1);
}

// Read and parse wallets.json
let wallets;
try {
  const walletsData = fs.readFileSync(walletsPath, 'utf8');
  wallets = JSON.parse(walletsData);
} catch (error) {
  console.error('❌ Error reading or parsing wallets.json:', error.message);
  process.exit(1);
}

// Ensure wallets array is valid
if (!Array.isArray(wallets) || wallets.length === 0) {
  console.error('❌ Error: wallets.json does not contain valid wallets.');
  process.exit(1);
}

// Function to get quote from API
async function getQuote(tokenA, tokenB, amount) {
  const url = `https://ebey72gfe6.execute-api.us-east-1.amazonaws.com/prod/quote?protocols=v2%2Cv3%2Cmixed&tokenInAddress=${tokenA}&tokenInChainId=80084&tokenOutAddress=${tokenB}&tokenOutChainId=80084&amount=${amount}&type=exactIn`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      }
    });

    console.log('📡 Full Quote API Response:', response.data);

    if (response.status === 200) {
      console.log('✅ Quote API response received.');
      return response.data;
    } else {
      throw new Error(`❌ Quote API Error: Status ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Error fetching quote:', error.message);
    throw error;
  }
}

// Function to get empty previousBlockHash
function getEmptyPreviousBlockHash() {
  return ethers.constants.HashZero; // 0x000...0000 (32 bytes)
}

// Function to perform swap for a specific wallet
async function performSwap(walletDetails) {
  const { wallet: WALLET_ADDRESS, privateKey: PRIVATE_KEY, id } = walletDetails;

  // Validate wallet details
  if (!WALLET_ADDRESS || !PRIVATE_KEY) {
    console.error(`❌ Error: Wallet with ID ${id} is missing address or privateKey.`);
    return;
  }

  try {
    // Initialize provider
    const provider = new ethers.providers.JsonRpcProvider(RPC_URLS[0]);

    // Initialize wallet
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // Initialize contract instances
    const wberaContract = new ethers.Contract(WBERA_CONTRACT_ADDRESS, ERC20_ABI, provider);
    const yeetContract = new ethers.Contract(YEET_CONTRACT_ADDRESS, ERC20_ABI, provider);
    const routerContract = new ethers.Contract(KODIAK_ROUTER_ADDRESS, PRIMATY_ABI, wallet);

    console.log(`\n🔄 Starting swap for Wallet ID ${id}: ${WALLET_ADDRESS}`);

    // 1. Get BERA balance
    const beraBalance = await provider.getBalance(WALLET_ADDRESS);
    console.log(`💰 BERA Balance: ${ethers.utils.formatEther(beraBalance)} BERA`);

    // 2. Get WBERA and YEET balances
    const wberaBalance = await wberaContract.balanceOf(WALLET_ADDRESS);
    console.log(`📈 WBERA Balance: ${ethers.utils.formatUnits(wberaBalance, 18)} WBERA`);

    const yeetBalance = await yeetContract.balanceOf(WALLET_ADDRESS);
    console.log(`📉 YEET Balance: ${ethers.utils.formatUnits(yeetBalance, 18)} YEET`);

    // 3. Calculate 20% of BERA balance, truncated to 4 decimals
    const beraBalanceFormatted = parseFloat(ethers.utils.formatEther(beraBalance));
    const amountInBERA = parseFloat((beraBalanceFormatted * 0.20).toFixed(4)); // 4 decimals
    const amountInWei = ethers.utils.parseEther(amountInBERA.toFixed(4)); // Convert to wei
    console.log(`📊 Amount In (20%): ${ethers.utils.formatEther(amountInWei)} BERA`);

    // 4. Get quote from API
    const quoteResponse = await getQuote(
      WBERA_CONTRACT_ADDRESS,
      YEET_CONTRACT_ADDRESS,
      amountInWei.toString()
    );

    // Check if 'amount' and 'quote' exist in the response
    if (!quoteResponse.amount || !quoteResponse.quote) {
      throw new Error('❌ "amount" and "quote" fields are missing in the Quote API response.');
    }

    const amountIn = quoteResponse.amount; // WBERA
    const amountOut = quoteResponse.quote; // YEET
    console.log(`🔍 Quote API - Amount In: ${amountIn} WBERA`);
    console.log(`🔍 Quote API - Amount Out: ${amountOut} YEET`);

    // 5. Encode swapExactTokensForTokens using SECONDARY_ABI
    const secondaryInterface = new ethers.utils.Interface(SECONDARY_ABI);
    const swapData = secondaryInterface.encodeFunctionData('swapExactTokensForTokens', [
      ethers.BigNumber.from(amountIn),
      ethers.BigNumber.from(amountOut).mul(99).div(100), // amountOutMin as 99% of amountOut
      [WBERA_CONTRACT_ADDRESS, YEET_CONTRACT_ADDRESS],
      WALLET_ADDRESS
    ]);

    console.log('📦 Encapsulated swapExactTokensForTokens data:', swapData);

    // 6. Set previousBlockHash as empty bytes32
    const previousBlockHash = getEmptyPreviousBlockHash();
    console.log(`🔗 previousBlockHash set to empty: ${previousBlockHash}`);

    // 7. Encode swapData in multicall using PRIMATY_ABI
    const dataArray = [swapData];
    const multicallParams = [previousBlockHash, dataArray];

    const encodedMulticallParams = ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'bytes[]'],
      multicallParams
    );

    console.log('🛠️ Encoded multicall parameters:', encodedMulticallParams);

    // 8. Multicall Method ID
    const multicallSelector = '0x5ae401dc';

    // 9. Final transaction data: MethodID + bytes32 + bytes
    const finalData = multicallSelector + encodedMulticallParams.slice(2);
    console.log('📄 Final transaction data:', finalData);

    // 10. Get baseFee from latest block
    const latestBlock = await provider.getBlock('latest');
    const baseFee = latestBlock.baseFeePerGas;
    if (!baseFee) {
      throw new Error('❌ Unable to fetch baseFee from the latest block.');
    }
    console.log(`⛽ Base Fee Per Gas: ${baseFee.toString()} wei`);

    // 11. Set maxFeePerGas and maxPriorityFeePerGas to 10 Gwei
    const maxFeePerGas = ethers.utils.parseUnits('10', 'gwei');
    const maxPriorityFeePerGas = ethers.utils.parseUnits('10', 'gwei');
    console.log(`📈 Max Fee Per Gas: ${maxFeePerGas.toString()} wei`);
    console.log(`🔺 Max Priority Fee Per Gas: ${maxPriorityFeePerGas.toString()} wei`);

    // 12. Generate random gasLimit between 1,200,000 and 2,000,000
    const gasLimitValue = Math.floor(Math.random() * (2000000 - 1200000 + 1)) + 1200000;
    const gasLimit = ethers.BigNumber.from(gasLimitValue);
    console.log(`🔧 Gas Limit: ${gasLimit.toString()}`);

    // 13. Prepare the transaction
    const tx = {
      to: KODIAK_ROUTER_ADDRESS,
      data: finalData,
      value: amountInWei, // Sending BERA as native value
      gasLimit: gasLimit,
      maxFeePerGas: maxFeePerGas,
      maxPriorityFeePerGas: maxPriorityFeePerGas,
      type: 2, // EIP-1559
      chainId: CHAIN_ID
    };

    console.log('🚀 Sending transaction...');

    // 14. Send the transaction
    const transactionResponse = await wallet.sendTransaction(tx);
    console.log(`📬 Transaction sent. Hash: ${TX_EXPLORER}${transactionResponse.hash}`);

    // 15. Wait for confirmation
    const receipt = await transactionResponse.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}.`);
    console.log(`🎉 Swap completed for Wallet ID ${id}.\n`);
  } catch (error) {
    if (error.code === 'CALL_EXCEPTION') {
      console.error('❌ Call exception occurred during the transaction.');
    } else {
      console.error('❌ An error occurred:', error.message);
    }
  }
}

// Function to execute swaps for multiple wallets
async function executeSwaps(walletsToProcess) {
  for (const walletDetails of walletsToProcess) {
    await performSwap(walletDetails);
  }
}

// Main function to interact with the user
async function main() {
  console.log('🔀 On which wallet would you like to perform swaps?');
  console.log('1️⃣ All of them');
  console.log('2️⃣ Specific Wallet ID');

  const choice = readline.question('Please enter your choice (1 or 2): ').trim();

  if (choice === '1') {
    console.log('\n🔄 Performing swaps on all wallets...');
    await executeSwaps(wallets);
    console.log('✅ Swaps completed on all wallets.');
  } else if (choice === '2') {
    // Prompt for Wallet ID
    const idInput = readline.question('🔢 Please enter the Wallet ID: ').trim();
    const walletId = parseInt(idInput, 10);

    if (isNaN(walletId)) {
      console.error('❌ Error: The entered ID is not a valid number.');
      process.exit(1);
    }

    const selectedWallet = wallets.find(w => w.id === walletId);

    if (!selectedWallet) {
      console.error(`❌ Error: No wallet found with ID ${walletId} in wallets.json.`);
      process.exit(1);
    }

    console.log(`\n✅ Selected Wallet ID ${walletId}: ${selectedWallet.wallet}`);
    await performSwap(selectedWallet);
    console.log('✅ Swap completed on the selected wallet.');
  } else {
    console.error('❌ Error: Invalid option. Please enter 1 or 2.');
    process.exit(1);
  }
}

// Execute the main function
main();
