// index.js

const clear = require('console-clear');
const inquirer = require('inquirer');
const ethers = require('ethers');
require('colors');

const { ABI, RPC_URL, CHAIN_ID, TX_EXPLORER, SYMBOL, STAKE_CONTRACT, WAGMI_ADDRESS } = require('./ABI');
const wallets = require('../../wallets.json');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getGasOptions(provider) {

  const feeData = await provider.getFeeData();
  const baseFee = feeData.lastBaseFee ? feeData.lastBaseFee : feeData.gasPrice;
  const maxFeePerGas = baseFee.mul(125).div(100);
  const maxPriorityFeePerGas = baseFee.mul(125).div(100);
  const gasLimit = Math.floor(Math.random() * (250000 - 150000 + 1)) + 150000;
  return { gasLimit, maxFeePerGas, maxPriorityFeePerGas };
}

async function processWallet(walletData, provider) {
  const wallet = new ethers.Wallet(walletData.privateKey, provider);

  const tokenABI = [
    ...ABI,
    {
      "constant": true,
      "inputs": [{ "name": "account", "type": "address" }],
      "name": "balanceOf",
      "outputs": [{ "name": "", "type": "uint256" }],
      "type": "function"
    }
  ];

  const tokenContract = new ethers.Contract(WAGMI_ADDRESS, tokenABI, wallet);
  const stakeContract = new ethers.Contract(STAKE_CONTRACT, ABI, wallet);

  // ─────────── STEP 1: Faucet ───────────
  console.log(`🔄 Initializing Step 1 For - [${wallet.address}]`.green);
  console.log("⏳ Claiming Faucet...".green);
  try {
    const gasOptions = await getGasOptions(provider);
    const tx = await tokenContract.faucet(wallet.address, gasOptions);
    console.log(`⚙️  Tx Hash Sent! ${TX_EXPLORER}${tx.hash}`.green);
    const receipt = await tx.wait();
    console.log(`✅ Tx Confirmed in Block [${receipt.blockNumber}]`.green);
  } catch (error) {
    if (error.message.includes("INSUFFICIENT_FUNDS")) {
      console.log("INSUFFICIENT_FUNDS error encountered. Skipping wallet.".green);
      return;
    } else if (error.message.includes("CALL_EXCEPTION")) {
      console.log("CALL_EXCEPTION error encountered.".green);
      return;
    } else {
      console.log(`Error in Step 1: ${error.message}`.green);
      return;
    }
  }
  await delay(5000);

  // ─────────── STEP 2: Approve ───────────
  console.log("🔄 Initializing Step 2".green);
  console.log("⏳ Approving WAGMI Tokens...".green);
  try {
    const gasOptions = await getGasOptions(provider);
    const tx = await tokenContract.approve(STAKE_CONTRACT, ethers.constants.MaxUint256, gasOptions);
    console.log(`⚙️  Tx Hash Sent! ${TX_EXPLORER}${tx.hash}`.green);
    const receipt = await tx.wait();
    console.log(`✅ Tx Confirmed in Block [${receipt.blockNumber}]`.green);
  } catch (error) {
    if (error.message.includes("INSUFFICIENT_FUNDS")) {
      console.log("INSUFFICIENT_FUNDS error encountered. Skipping wallet.".green);
      return;
    } else if (error.message.includes("CALL_EXCEPTION")) {
      console.log("CALL_EXCEPTION error encountered.".green);
      return;
    } else {
      console.log(`Error in Step 2: ${error.message}`.green);
      return;
    }
  }
  await delay(5000);

  // ─────────── STEP 3: Stake ───────────
  console.log("🔄 Initializing Step 3".green);
  console.log("⏳ Staking WAGMI Tokens in Vault".green);
  try {
    // Consultar balance total de tokens WAGMI en la wallet
    const balance = await tokenContract.balanceOf(wallet.address);
    const gasOptions = await getGasOptions(provider);
    const tx = await stakeContract.stake(balance, gasOptions);
    console.log(`⚙️  Tx Hash Sent! ${TX_EXPLORER}${tx.hash}`.green);
    const receipt = await tx.wait();
    console.log(`✅ Tx Confirmed in Block [${receipt.blockNumber}]\n`.green);
  } catch (error) {
    if (error.message.includes("INSUFFICIENT_FUNDS")) {
      console.log("INSUFFICIENT_FUNDS error encountered. Skipping wallet.".green);
      return;
    } else if (error.message.includes("CALL_EXCEPTION")) {
      console.log("CALL_EXCEPTION error encountered.".green);
      return;
    } else {
      console.log(`Error in Step 3: ${error.message}`.green);
      return;
    }
  }
}

async function runAllWallets() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL, CHAIN_ID);
  for (const walletData of wallets) {
    await processWallet(walletData, provider);
    await delay(5000);
  }
}

async function main() {
  clear(); // Limpia la consola
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'repeat',
      message: 'Do you want to run in a random interval every 9 to 12 hours?',
      default: false
    }
  ]);

  if (answer.repeat) {
    while (true) {
      await runAllWallets();
      const hours = Math.floor(Math.random() * (12 - 9 + 1)) + 9;
      console.log(`Waiting for ${hours} hours before next run...`.green);
      await delay(hours * 3600 * 1000);
    }
  } else {
    await runAllWallets();
  }
}

main().catch(err => console.error(err));
