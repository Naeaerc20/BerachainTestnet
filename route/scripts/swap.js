// swap.js

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const readline = require('readline');
const {
  BEX_ROUTER_ADDRESS,
  BEX_MULTISWAP_ABI,
  YEET_CONTRACT_ADDRESS,
  WBERA_CONTRACT_ADDRESS,
  RPC_URLS,
  TX_EXPLORER,
  ERC20_ABI,
  WBERA_ABI
} = require('../ABI.js'); // Adjust the path as needed

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => {
    rl.question(query, answer => {
      resolve(answer);
    });
  });
}

function getWallets() {
  const WALLETS_FILE_PATH = path.join(__dirname, '../../wallets.json'); // Adjust the path as needed

  try {
    const data = fs.readFileSync(WALLETS_FILE_PATH, 'utf8');
    const wallets = JSON.parse(data);
    return wallets;
  } catch (error) {
    console.error('❌ Error reading wallets.json:', error.message);
    process.exit(1);
  }
}

async function filterEligibleWallets(wallets, selectedIDs = null) {
  const eligibleWallets = [];
  const provider = new ethers.providers.JsonRpcProvider(RPC_URLS[0]);

  for (const walletInfo of wallets) {
    const { id, wallet: walletAddress, privateKey } = walletInfo;

    if (selectedIDs && !selectedIDs.includes(id)) {
      continue;
    }

    try {
      const beraBalance = await provider.getBalance(walletAddress);
      const beraBalanceFormatted = parseFloat(ethers.utils.formatEther(beraBalance));

      if (beraBalanceFormatted >= 0.01) { // Adjust the threshold as needed
        eligibleWallets.push({
          id,
          walletAddress,
          privateKey,
          balance: beraBalanceFormatted,
          balanceWei: beraBalance
        });
      }
    } catch (error) {
      console.error(`⚠️  Error fetching balance for Wallet ID ${id}: ${walletAddress} -`, error.message);
    }
  }

  return eligibleWallets;
}

function getRandomPercentage(min, max, decimals) {
  const rand = Math.random() * (max - min) + min;
  return parseFloat(rand.toFixed(decimals));
}

async function checkAndApproveToken(wallet, tokenAddress, spenderAddress, walletID) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

  try {
    let tokenName = tokenAddress;
    try {
      tokenName = await tokenContract.name();
    } catch (nameError) {
      console.warn(`⚠️  Token at ${tokenAddress} does not implement 'name'. Using address as name.`);
    }

    let decimals = 18;
    try {
      decimals = await tokenContract.decimals();
    } catch (decError) {
      console.warn(`⚠️  Token at ${tokenAddress} does not implement 'decimals'. Defaulting to 18.`);
    }

    const minApproval = ethers.utils.parseUnits("1", decimals);

    let allowance;
    try {
      allowance = await tokenContract.allowance(wallet.address, spenderAddress);
    } catch (allowanceError) {
      console.warn(`⚠️  Token at ${tokenAddress} does not implement 'allowance'. Skipping approval.`);
      return { approved: false, reason: 'NO_ALLOWANCE_FUNCTION' };
    }

    if (allowance.lt(minApproval)) {
      console.log(`✅ ${tokenName} is not sufficiently approved for Wallet ID: ${walletID} - Proceeding with Approval`);
      console.log(`🔄 Approving ${tokenName} for Wallet ID: ${walletID}`);

      const feeData = await wallet.provider.getFeeData();
      const baseFee = feeData.lastBaseFeePerGas;
      if (!baseFee) {
        console.error(`❌ Unable to fetch baseFee. Aborting approval for ${tokenName} on Wallet ID: ${walletID}`);
        return { approved: false, reason: 'GAS_FEE_FETCH_ERROR' };
      }
      const maxPriorityFeePerGas = baseFee.mul(130).div(100);
      const maxFeePerGas = baseFee.mul(130).div(100);

      const tx = await tokenContract.approve(spenderAddress, ethers.constants.MaxUint256, {
        gasLimit: 2000000,
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas
      });
      console.log(`✅ ${tokenName} Approved for Wallet ID: ${walletID} - Tx Hash: ${TX_EXPLORER}${tx.hash}`);

      await tx.wait();
      console.log(`✅ Approval completed for ${tokenName} on Wallet ID: ${walletID}\n`);

      await new Promise(resolve => setTimeout(resolve, 1000));

      return { approved: true };
    } else {
      console.log(`✅ ${tokenName} is already approved for Wallet ID: ${walletID} - Skipping Approval\n`);
      return { approved: false, reason: 'ALREADY_APPROVED' };
    }
  } catch (error) {
    console.error(`❌ Error approving token ${tokenAddress} for Wallet ID: ${walletID}:`, error.message);
    return { approved: false, reason: error.message };
  }
}

async function convertBeraCoins(wallet, walletID) {
  try {
    const wberaContract = new ethers.Contract(WBERA_CONTRACT_ADDRESS, WBERA_ABI, wallet);

    // Get BERA balance
    const beraBalance = await wallet.provider.getBalance(wallet.address);
    const beraBalanceFormatted = parseFloat(ethers.utils.formatEther(beraBalance));

    if (beraBalanceFormatted < 0.01) { // Adjust the threshold as needed
      console.log(`⚠️  Wallet ID ${walletID}: ${wallet.address} - Insufficient BERA balance to convert to WBERA.\n`);
      return { success: false, reason: 'INSUFFICIENT_BERA_TO_CONVERT' };
    }

    // Decide how much to convert (random percentage between 40% and 45% of BERA balance)
    const percentage = getRandomPercentage(40, 45, 2);
    console.log(`🔢 Wallet ID ${walletID}: Converting ${percentage}% of BERA balance to WBERA.`);

    const percentageBN = ethers.BigNumber.from(Math.round(percentage * 100));
    const amountToConvert = beraBalance.mul(percentageBN).div(10000);

    console.log(`🔄 Converting ${ethers.utils.formatEther(amountToConvert)} BERA to WBERA for Wallet ID: ${walletID}`);

    // Send deposit transaction to wrap BERA into WBERA
    const feeData = await wallet.provider.getFeeData();
    const baseFee = feeData.lastBaseFeePerGas;
    if (!baseFee) {
      console.error(`❌ Unable to fetch baseFee. Aborting conversion for Wallet ID: ${walletID}`);
      return { success: false, reason: 'GAS_FEE_FETCH_ERROR' };
    }
    const maxPriorityFeePerGas = baseFee.mul(130).div(100);
    const maxFeePerGas = baseFee.mul(130).div(100);

    const tx = await wberaContract.deposit({
      gasLimit: 2000000,
      maxFeePerGas: maxFeePerGas,
      maxPriorityFeePerGas: maxPriorityFeePerGas,
      value: amountToConvert // Sending BERA as native currency
    });

    console.log(`✅ Deposit Transaction sent for Wallet ID: ${walletID} - Tx Hash: ${TX_EXPLORER}${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ BERA converted to WBERA in Block: ${receipt.blockNumber}\n`);

    await new Promise(resolve => setTimeout(resolve, 1000));

    return { success: true };
  } catch (error) {
    console.error(`❌ Error converting BERA to WBERA for Wallet ID: ${walletID}:`, error.message, '\n');
    return { success: false, reason: error.message };
  }
}

async function sendSwapTransaction(walletInfo) {
  const { id, walletAddress, privateKey, balance, balanceWei } = walletInfo;

  const provider = new ethers.providers.JsonRpcProvider(RPC_URLS[0]);
  const wallet = new ethers.Wallet(privateKey, provider);

  const bexRouterContract = new ethers.Contract(BEX_ROUTER_ADDRESS, BEX_MULTISWAP_ABI, wallet);

  const tokensToApprove = [
    {
      address: YEET_CONTRACT_ADDRESS,
      name: '$YEET'
    },
    {
      address: WBERA_CONTRACT_ADDRESS,
      name: 'WBERA'
    }
    // Add more ERC20 tokens here if needed
  ];

  for (const token of tokensToApprove) {
    await checkAndApproveToken(wallet, token.address, BEX_ROUTER_ADDRESS, id);
  }

  // Convert BERA to WBERA
  const convertResult = await convertBeraCoins(wallet, id);
  if (!convertResult.success) {
    console.log(`⚠️  Wallet ID ${id}: ${walletAddress} - Skipping swap due to conversion failure.\n`);
    return { success: false, reason: 'CONVERSION_FAILED' };
  }

  // Wait 1 second after conversion
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Swap using WBERA balance
  try {
    const wberaContract = new ethers.Contract(WBERA_CONTRACT_ADDRESS, ERC20_ABI, wallet);
    const wberaBalance = await wberaContract.balanceOf(wallet.address);
    const wberaBalanceFormatted = parseFloat(ethers.utils.formatUnits(wberaBalance, 18));

    if (wberaBalanceFormatted < 0.01) { // Adjust the threshold as needed
      console.log(`⚠️  Wallet ID ${id}: ${walletAddress} - Insufficient WBERA balance for swap.\n`);
      return { success: false, reason: 'INSUFFICIENT_WBERA_BALANCE' };
    }

    const amountIn = wberaBalance; // Using entire WBERA balance
    const minOut = 1; // Adjust as needed

    const steps = [
      {
        poolidx: 36000,
        tokenA: YEET_CONTRACT_ADDRESS, // According to your parameters
        tokenB: WBERA_CONTRACT_ADDRESS,
        isBuy: false
      }
    ];

    const multiSwapData = bexRouterContract.interface.encodeFunctionData('multiSwap', [
      steps,
      amountIn.toString(),
      minOut.toString()
    ]);

    const feeData = await wallet.provider.getFeeData();
    const baseFee = feeData.lastBaseFeePerGas;
    if (!baseFee) {
      console.error(`❌ Unable to fetch baseFee. Aborting swap for Wallet ID: ${id}`);
      return { success: false, reason: 'GAS_FEE_FETCH_ERROR' };
    }
    const maxPriorityFeePerGas = baseFee.mul(130).div(100);
    const maxFeePerGas = baseFee.mul(130).div(100);

    const tx = {
      to: BEX_ROUTER_ADDRESS,
      data: multiSwapData,
      gasLimit: 2000000,
      maxFeePerGas: maxFeePerGas,
      maxPriorityFeePerGas: maxPriorityFeePerGas,
      // value is not included since WBERA is an ERC20 token
    };

    const amountInFormatted = parseFloat(ethers.utils.formatEther(amountIn));
    console.log(`🔄 Preparing to swap ${amountInFormatted} WBERA to YEET for Wallet ID: ${id}`);

    const transactionResponse = await wallet.sendTransaction(tx);
    console.log(`✅ Wallet ID ${id}: ${walletAddress}`);
    console.log(`💰 WBERA Balance: ${wberaBalanceFormatted} WBERA`);
    console.log(`🔄 Swapping: ${amountInFormatted} WBERA to YEET`);
    console.log(`📦 Preparing multiSwap with steps: ${JSON.stringify(steps, null, 2)}`);
    console.log(`📝 Tx Hash: ${TX_EXPLORER}${transactionResponse.hash}`);

    const receipt = await transactionResponse.wait();
    console.log(`✅ Tx Confirmed in Block: ${receipt.blockNumber}\n`);

    await new Promise(resolve => setTimeout(resolve, 1000));

    return { success: true };
  } catch (error) {
    if (error.code === 'CALL_EXCEPTION') {
      console.error(`❌ Wallet ID ${id}: ${walletAddress} - Failed with CALL_EXCEPTION\n`);
      return { success: false, reason: 'CALL_EXCEPTION' };
    } else {
      console.error(`❌ Wallet ID ${id}: ${walletAddress} - Error:`, error.message, '\n');
      return { success: false, reason: error.code || 'UNKNOWN_ERROR' };
    }
  }
}

async function processWalletsSequentially(eligibleWallets) {
  const failedWallets = [];

  for (const walletInfo of eligibleWallets) {
    const result = await sendSwapTransaction(walletInfo);

    if (!result.success) {
      failedWallets.push(walletInfo);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return failedWallets;
}

async function main() {
  const wallets = getWallets();

  console.log("Which wallets would you like to perform swaps on?");
  console.log("1. All of them");
  console.log("2. Specific IDs");

  const selection = await askQuestion('Enter your choice (1 or 2): ');

  let selectedWallets = [];

  if (selection.trim() === '1') {
    console.log('\n🔍 Filtering eligible wallets...\n');
    selectedWallets = await filterEligibleWallets(wallets);
  } else if (selection.trim() === '2') {
    const idsInput = await askQuestion('Enter the wallet IDs separated by spaces (e.g., 1 2 4 5 6): ');
    const ids = idsInput.trim().split(/\s+/).map(id => parseInt(id)).filter(id => !isNaN(id));

    if (ids.length === 0) {
      console.log('⚠️  No valid IDs entered. Exiting.');
      rl.close();
      return;
    }

    console.log('\n🔍 Filtering eligible wallets...\n');
    selectedWallets = await filterEligibleWallets(wallets, ids);
  } else {
    console.log('⚠️ Invalid selection. Exiting.');
    rl.close();
    return;
  }

  rl.close();

  console.log(`✅ Total eligible wallets: ${selectedWallets.length}\n`);

  if (selectedWallets.length === 0) {
    console.log('⚠️  No eligible wallets to perform swaps.');
    return;
  }

  const failedWallets = await processWalletsSequentially(selectedWallets);

  if (failedWallets.length > 0) {
    console.log('🔄 Retrying failed wallets...\n');

    const retryFailedWallets = await processWalletsSequentially(failedWallets);

    if (retryFailedWallets.length > 0) {
      console.log(`❌ Still ${retryFailedWallets.length} wallets failed after retry.`);
    } else {
      console.log('✅ All failed wallets have been successfully retried.');
    }
  }

  console.log('🎉 All transactions have been processed.');
}

main();
