// liquidity.js

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const readline = require('readline');
const { execFile } = require('child_process');

const {
  KODIAK_LP_MANAGER_ADDRESS,
  KODIAK_LP_MANAGER_ABI,
  YEET_CONTRACT_ADDRESS,
  BERA_CONTRACT_ADDRESS,
  RPC_URLS,
  TX_EXPLORER,
  ERC20_ABI,
} = require('../ABI.js'); // Adjust the path if necessary

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

function getWallets() {
  const WALLETS_FILE_PATH = path.join(__dirname, '../../wallets.json'); // Adjust the path if necessary

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

      if (beraBalanceFormatted >= 1) { // Adjust the threshold as needed
        eligibleWallets.push({
          id,
          walletAddress,
          privateKey,
          balance: beraBalanceFormatted,
          balanceWei: beraBalance,
        });
      }
    } catch (error) {
      console.error(`⚠️  Error getting balance for Wallet ID ${id}: ${walletAddress} -`, error.message);
    }
  }

  return eligibleWallets;
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
      console.warn(`⚠️  Token at ${tokenAddress} does not implement 'decimals'. Using 18 by default.`);
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
      console.log(`✅ ${tokenName} is not sufficiently approved for Wallet ID: ${walletID} - Proceeding with approval`);
      console.log(`🔄 Approving ${tokenName} for Wallet ID: ${walletID}`);

      const tx = await tokenContract.approve(spenderAddress, ethers.constants.MaxUint256);
      console.log(`✅ ${tokenName} approved for Wallet ID: ${walletID} - Tx Hash: ${TX_EXPLORER}${tx.hash}`);

      await tx.wait();
      console.log(`✅ Approval completed for ${tokenName} in Wallet ID: ${walletID}\n`);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      return { approved: true };
    } else {
      console.log(`✅ ${tokenName} is already approved for Wallet ID: ${walletID} - Skipping approval\n`);
      return { approved: false, reason: 'ALREADY_APPROVED' };
    }
  } catch (error) {
    console.error(`❌ Error approving token ${tokenAddress} for Wallet ID: ${walletID}:`, error.message);
    return { approved: false, reason: error.message };
  }
}

async function addLiquidity(walletInfo) {
  const { id, walletAddress, privateKey } = walletInfo;

  const provider = new ethers.providers.JsonRpcProvider(RPC_URLS[0]);
  const wallet = new ethers.Wallet(privateKey, provider);

  const lpManagerContract = new ethers.Contract(
    KODIAK_LP_MANAGER_ADDRESS,
    KODIAK_LP_MANAGER_ABI,
    wallet
  );

  // Fetch pool data by executing getPoolInfo.js
  const pathToGetPoolInfo = path.join(__dirname, 'getPoolInfo.js');

  let kodiakVault;
  try {
    const { stdout, stderr } = await new Promise((resolve, reject) => {
      execFile('node', [pathToGetPoolInfo], (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });

    if (stderr) {
      console.error(`❌ Error in getPoolInfo.js for Wallet ID: ${id}:`, stderr);
      return { success: false };
    }

    const responseData = JSON.parse(stdout);

    if (!responseData || !responseData.data || !responseData.data.kodiakVault) {
      console.error(`❌ Could not fetch pool data for Wallet ID: ${id}`);
      return { success: false };
    }

    kodiakVault = responseData.data.kodiakVault;
  } catch (error) {
    console.error(`❌ Error fetching pool data for Wallet ID: ${id}:`, error.message);
    return { success: false };
  }

  // Extract necessary data
  const token0 = kodiakVault._token0; // YEET
  const token1 = kodiakVault._token1; // WBERA
  const token0Decimals = parseInt(token0.decimals);
  const token1Decimals = parseInt(token1.decimals);
  const token0Price = parseFloat(kodiakVault.pool.token0Price); // YEET price in WBERA
  const outputTokenSupply = ethers.BigNumber.from(kodiakVault.outputTokenSupply);
  const totalValueLockedToken0 = kodiakVault.pool.totalValueLockedToken0;
  const totalValueLockedToken1 = kodiakVault.pool.totalValueLockedToken1;

  // Get balances
  const beraBalance = await wallet.getBalance();
  const beraDecimals = 18; // BERA decimals
  const beraBalanceFormatted = parseFloat(ethers.utils.formatUnits(beraBalance, beraDecimals));

  // Decide the amount of BERA to contribute
  const amountBeraToContribute = beraBalanceFormatted * 0.99 * 0.98; // Use 98% of 99% to leave some gas
  if (amountBeraToContribute <= 0) {
    console.log(`⚠️  Wallet ID ${id}: Insufficient BERA balance.`);
    return { success: false };
  }

  const amount1Max = ethers.utils.parseUnits(amountBeraToContribute.toString(), beraDecimals);

  // Calculate amount0Max (YEET)
  const amount0MaxFloat = (amountBeraToContribute / token0Price) * 0.98; // Reduce by 2%
  const amount0Max = ethers.utils.parseUnits(amount0MaxFloat.toFixed(token0Decimals), token0Decimals);

  // Check YEET balance
  const yeetContract = new ethers.Contract(YEET_CONTRACT_ADDRESS, ERC20_ABI, wallet);
  const yeetBalance = await yeetContract.balanceOf(wallet.address);
  const yeetBalanceFormatted = parseFloat(ethers.utils.formatUnits(yeetBalance, token0Decimals));

  if (yeetBalance.lt(amount0Max)) {
    console.log(`⚠️  Wallet ID ${id}: Insufficient YEET balance. Need ${amount0MaxFloat.toFixed(token0Decimals)} YEET, but have ${yeetBalanceFormatted} YEET.`);
    return { success: false };
  }

  // Apply slippage
  const slippage = 0.02; // 2% slippage
  const amount0Min = amount0Max.mul(100 - slippage * 100).div(100);
  const amount1Min = amount1Max.mul(100 - slippage * 100).div(100);

  // Calculate amountSharesMin
  const totalLiquidityToken0BN = ethers.utils.parseUnits(totalValueLockedToken0, token0Decimals);
  const totalLiquidityToken1BN = ethers.utils.parseUnits(totalValueLockedToken1, token1Decimals);

  // Calculate total liquidity value in WBERA terms and reduce by 2%
  const token0PriceBN = ethers.utils.parseUnits(token0Price.toString(), beraDecimals);
  const totalLiquidityValue = totalLiquidityToken1BN.add(
    totalLiquidityToken0BN.mul(token0PriceBN).div(ethers.utils.parseUnits('1', token0Decimals))
  ).mul(98).div(100); // Reduce by 2%

  // Calculate contribution value in WBERA terms and reduce by 2%
  const contributionValue = amount1Max.add(
    amount0Max.mul(token0PriceBN).div(ethers.utils.parseUnits('1', token0Decimals))
  ).mul(98).div(100); // Reduce by 2%

  // Calculate share ratio
  const shareRatio = contributionValue.mul(ethers.utils.parseUnits('1', 18)).div(totalLiquidityValue);

  // Calculate amountSharesMin
  const amountSharesMin = outputTokenSupply.mul(shareRatio).div(ethers.utils.parseUnits('1', 18));

  // Apply slippage
  const amountSharesMinAdjusted = amountSharesMin.mul(100 - slippage * 100).div(100);

  // Approve YEET if necessary
  await checkAndApproveToken(wallet, YEET_CONTRACT_ADDRESS, KODIAK_LP_MANAGER_ADDRESS, id);

  // Execute the transaction
  try {
    const tx = await lpManagerContract.addLiquidityNative(
      kodiakVault.id,     // island (pool address)
      amount0Max,         // amount0Max (YEET)
      amount1Max,         // amount1Max (BERA)
      amount0Min,         // amount0Min
      amount1Min,         // amount1Min
      amountSharesMinAdjusted, // amountSharesMin
      wallet.address,     // receiver
      {
        value: amount1Max, // Send BERA as native value
        gasLimit: 2000000,
      }
    );

    console.log(`🔄 Wallet ID ${id}: Adding liquidity...`);
    console.log(`📝 Tx Hash: ${TX_EXPLORER}${tx.hash}`);

    await tx.wait();
    console.log(`✅ Liquidity added successfully.\n`);

    return { success: true };
  } catch (error) {
    console.error(`❌ Error adding liquidity: ${error.message}`);
    return { success: false };
  }
}

async function processWalletsSequentially(eligibleWallets) {
  const failedWallets = [];

  for (const walletInfo of eligibleWallets) {
    const result = await addLiquidity(walletInfo);

    if (!result || !result.success) {
      failedWallets.push(walletInfo);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return failedWallets;
}

async function main() {
  const wallets = getWallets();

  console.log("Which wallets would you like to add liquidity to?");
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
    console.log('⚠️  No eligible wallets to add liquidity.');
    return;
  }

  const failedWallets = await processWalletsSequentially(selectedWallets);

  if (failedWallets.length > 0) {
    console.log('🔄 Retrying failed wallets...\n');

    const retryFailedWallets = await processWalletsSequentially(failedWallets);

    if (retryFailedWallets.length > 0) {
      console.log(`❌ Still ${retryFailedWallets.length} wallets failed after retrying.`);
    } else {
      console.log('✅ All failed wallets processed successfully after retrying.');
    }
  }

  console.log('🎉 All transactions have been processed.');
}

main();
