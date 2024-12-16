// swap.js
const { ethers } = require('ethers');
const readlineSync = require('readline-sync');
const path = require('path');
const fs = require('fs');

// Load ABI and constants
const { ABI, BERASWAP_ROUTER, RPC_URL, CHAIN_ID, TX_EXPLORER, SYMBOL } = require('../ABI.js');

// Utility functions
function parseAmount(amountStr) {
  // Assuming 18 decimals for simplicity.
  return ethers.utils.parseEther(amountStr);
}

function loadWallets() {
  const walletsPath = path.join(__dirname, '..', '..', '..', 'wallets.json');
  return JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
}

function selectWallet(wallets, id) {
  const w = wallets.find(w => w.id === id);
  if (!w) {
    console.error(`❌ Wallet with ID=${id} not found.`);
    return null;
  }
  return w;
}

function loadTokens() {
  const tokensPath = path.join(__dirname, 'tokens.json');
  return JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
}

function getHighGasParams() {
  const gasLimit = 1000000;
  const maxFeePerGas = ethers.utils.parseUnits('15', 'gwei'); 
  const maxPriorityFeePerGas = ethers.utils.parseUnits('15', 'gwei');
  console.log(`🟢 Hight Fee Data Enabled`);
  return { gasLimit, maxFeePerGas, maxPriorityFeePerGas };
}

async function checkAndApproveIfNeeded(tokenSymbol, tokenAddress, amountIn, signer) {
  // If the token is BERA, no approval needed
  if (tokenSymbol === 'BERA') {
    console.log(`✅ ${tokenSymbol} (native BERA) does not require approval.`);
    return;
  }

  // ERC20 ABI for allowance and approve
  const erc20ABI = [
    {
      "constant": true,
      "inputs": [
        { "name": "_owner", "type": "address" },
        { "name": "_spender", "type": "address" }
      ],
      "name": "allowance",
      "outputs": [{ "name": "", "type": "uint256" }],
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        { "name": "_spender", "type": "address" },
        { "name": "_value", "type": "uint256" }
      ],
      "name": "approve",
      "outputs": [{ "name": "", "type": "bool" }],
      "type": "function"
    }
  ];

  const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer);
  console.log(`🔑 Checking approval for [${tokenSymbol}]...`);
  const currentAllowance = await tokenContract.allowance(signer.address, BERASWAP_ROUTER);

  if (currentAllowance.gte(amountIn)) {
    console.log(`✅ [${tokenSymbol}] is already approved for the required amount.`);
  } else {
    console.log(`🔑 Approving [${tokenSymbol}] with MaxUint256...`);
    const gasParams = getHighGasParams();
    const approveTx = await tokenContract.approve(
      BERASWAP_ROUTER, 
      ethers.constants.MaxUint256, 
      { gasLimit: gasParams.gasLimit, maxFeePerGas: gasParams.maxFeePerGas, maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas }
    );
    await approveTx.wait();
    console.log(`✅ Approval completed for [${tokenSymbol}].`);
  }
}

async function getTokenBalance(signer, tokenAddress) {
  const erc20ABI = [
    {
      "constant": true,
      "inputs": [{ "name": "_owner", "type": "address" }],
      "name": "balanceOf",
      "outputs": [{ "name": "", "type": "uint256" }],
      "type": "function"
    }
  ];
  
  const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer.provider);
  const balance = await tokenContract.balanceOf(signer.address);
  return balance;
}

async function getBalances(signer, tokenASymbol, tokenAAddress, tokenBSymbol, tokenBAddress, wberaAddress) {
  let balanceA;
  let balanceB;

  if (tokenASymbol === 'BERA') {
    balanceA = await signer.getBalance();
  } else {
    balanceA = await getTokenBalance(signer, tokenAAddress);
  }

  if (tokenBSymbol === 'BERA') {
    balanceB = await signer.getBalance();
  } else {
    balanceB = await getTokenBalance(signer, tokenBAddress);
  }

  console.log(`\n💰 Current Balances of Wallet [${signer.address}]:`);
  console.log(`   ${tokenASymbol}: ${ethers.utils.formatEther(balanceA)}`);
  console.log(`   ${tokenBSymbol}: ${ethers.utils.formatEther(balanceB)}`);
  console.log();
}

async function performSwap(signer, beraswapRouter, symbolToAddress) {
  const tokenASymbol = readlineSync.question('Insert TokenA (Base): ').toUpperCase();
  const tokenBSymbol = readlineSync.question('Insert TokenB (Quote): ').toUpperCase();

  const isTokenA_BERA = (tokenASymbol === 'BERA');
  const isTokenB_BERA = (tokenBSymbol === 'BERA');

  // Get WBERA address
  const wberaAddress = symbolToAddress['WBERA'];
  if (!wberaAddress) {
    console.error('❌ WBERA not found in tokens.json');
    return;
  }

  let tokenAAddress = isTokenA_BERA ? wberaAddress : symbolToAddress[tokenASymbol];
  let tokenBAddress = isTokenB_BERA ? wberaAddress : symbolToAddress[tokenBSymbol];

  if (!isTokenA_BERA && !tokenAAddress) {
    console.error(`❌ Token ${tokenASymbol} not found in tokens.json`);
    return;
  }
  if (!isTokenB_BERA && !tokenBAddress) {
    console.error(`❌ Token ${tokenBSymbol} not found in tokens.json`);
    return;
  }

  await getBalances(signer, tokenASymbol, tokenAAddress, tokenBSymbol, tokenBAddress, wberaAddress);

  const amountInStr = readlineSync.question('How much you want to Swap? ');
  const amountIn = parseAmount(amountInStr);

  console.log(`\n🔗 Performing Swap [${tokenASymbol}/${tokenBSymbol}]`);

  const amountOutMin = 1;
  const deadline = Math.floor(Date.now() / 1000) + (60 * 20); // 20 minutes

  // ABI para WBERA (WETH-like)
  const wberaABI = [
    "function deposit() payable",
    "function withdraw(uint256)"
  ];
  const wberaContract = new ethers.Contract(wberaAddress, wberaABI, signer);

  try {
    // Caso especial: BERA -> WBERA (deposit)
    if (isTokenA_BERA && tokenBSymbol === 'WBERA') {
      console.log(`🔄 Converting BERA to WBERA via deposit()...`);
      const gasParams = getHighGasParams();
      const tx = await wberaContract.deposit({
        value: amountIn,
        gasLimit: gasParams.gasLimit,
        maxFeePerGas: gasParams.maxFeePerGas,
        maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas
      });
      console.log(`📨 Tx Hash Sent! - ${TX_EXPLORER}${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`🏦 Tx Confirmed in Block Number [${receipt.blockNumber}]`);
      return;
    }

    // Caso especial: WBERA -> BERA (withdraw)
    if (tokenASymbol === 'WBERA' && isTokenB_BERA) {
      console.log(`🔄 Converting WBERA to BERA via withdraw()...`);
      const gasParams = getHighGasParams();
      const tx = await wberaContract.withdraw(amountIn, {
        gasLimit: gasParams.gasLimit,
        maxFeePerGas: gasParams.maxFeePerGas,
        maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas
      });
      console.log(`📨 Tx Hash Sent! - ${TX_EXPLORER}${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`🏦 Tx Confirmed in Block Number [${receipt.blockNumber}]`);
      return;
    }

    if (isTokenA_BERA && isTokenB_BERA) {
      console.error('❌ Swapping BERA to BERA makes no sense.');
      return;
    }

    // Check approval if needed
    if (!isTokenA_BERA) {
      await checkAndApproveIfNeeded(tokenASymbol, tokenAAddress, amountIn, signer);
    } else {
      console.log(`✅ ${tokenASymbol} is BERA-based swap, no token approval needed.`);
    }

    if (!isTokenB_BERA) {
      await checkAndApproveIfNeeded(tokenBSymbol, tokenBAddress, amountIn, signer);
    } else {
      console.log(`✅ ${tokenBSymbol} is BERA-based, no token approval needed.`);
    }

    const gasParams = getHighGasParams();

    if (isTokenA_BERA) {
      // swapExactETHForTokens
      const pathArray = [wberaAddress, tokenBAddress];
      const tx = await beraswapRouter.swapExactETHForTokens(
        amountOutMin,
        pathArray,
        signer.address,
        deadline,
        { 
          value: amountIn,
          gasLimit: gasParams.gasLimit,
          maxFeePerGas: gasParams.maxFeePerGas,
          maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas
        }
      );
      console.log(`📨 Tx Hash Sent! - ${TX_EXPLORER}${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`🏦 Tx Confirmed in Block Number [${receipt.blockNumber}]`);

    } else if (isTokenB_BERA) {
      // swapExactTokensForETH
      const pathArray = [tokenAAddress, wberaAddress];
      const tx = await beraswapRouter.swapExactTokensForETH(
        amountIn,
        amountOutMin,
        pathArray,
        signer.address,
        deadline,
        { 
          gasLimit: gasParams.gasLimit, 
          maxFeePerGas: gasParams.maxFeePerGas, 
          maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas
        }
      );
      console.log(`📨 Tx Hash Sent! - ${TX_EXPLORER}${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`🏦 Tx Confirmed in Block Number [${receipt.blockNumber}]`);

    } else {
      // swapExactTokensForTokens
      const tx = await beraswapRouter.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        [tokenAAddress, tokenBAddress],
        signer.address,
        deadline,
        {
          gasLimit: gasParams.gasLimit, 
          maxFeePerGas: gasParams.maxFeePerGas, 
          maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas
        }
      );
      console.log(`📨 Tx Hash Sent! - ${TX_EXPLORER}${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`🏦 Tx Confirmed in Block Number [${receipt.blockNumber}]`);
    }

  } catch (err) {
    console.error("❌ An error occurred during the transaction:", err);
  }
}

(async () => {
  let wallets = loadWallets();

  const walletIdStr = readlineSync.question('Insert the Wallet ID to use: ');
  const walletId = parseInt(walletIdStr, 10);
  if (isNaN(walletId)) {
    console.error('❌ Invalid Wallet ID.');
    process.exit(1);
  }

  let selectedWallet = selectWallet(wallets, walletId);
  if(!selectedWallet) {
    process.exit(1);
  }

  let provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  let signer = new ethers.Wallet(selectedWallet.privateKey, provider);

  const tokensList = loadTokens();
  const symbolToAddress = {};
  tokensList.forEach(token => {
    symbolToAddress[token.symbol.toUpperCase()] = token.address;
  });

  const beraswapRouter = new ethers.Contract(BERASWAP_ROUTER, ABI, signer);

  let continueSwapping = true;

  while (continueSwapping) {
    await performSwap(signer, beraswapRouter, symbolToAddress);

    const anotherSwap = readlineSync.question('Would you like to perform another swap? (Y/N) ').toUpperCase();
    if (anotherSwap === 'Y') {
      const sameWallet = readlineSync.question('Do you wish to use same Wallet ID? (Y/N) ').toUpperCase();
      if (sameWallet === 'Y') {
        // Same wallet, do nothing
      } else {
        const newWalletIdStr = readlineSync.question('Insert the new Wallet ID: ');
        const newWalletId = parseInt(newWalletIdStr, 10);
        if (isNaN(newWalletId)) {
          console.error('❌ Invalid Wallet ID.');
          process.exit(1);
        }
        const newSelectedWallet = selectWallet(wallets, newWalletId);
        if(!newSelectedWallet) {
          console.error('❌ Failed to switch wallet. Exiting.');
          process.exit(1);
        }
        selectedWallet = newSelectedWallet;
        signer = new ethers.Wallet(selectedWallet.privateKey, provider);
      }
    } else {
      continueSwapping = false;
    }
  }

  console.log('👋 Exiting the swap application. Goodbye!');
})();
