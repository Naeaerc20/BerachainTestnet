// BerachainTestnet/actions/MemeSwap/scripts/deposit_vault.js

const fs = require('fs');
const path = require('path');
const readlineSync = require('readline-sync');
const { ethers } = require('ethers');
const {
    RPC_URL,
    CHAIN_ID,
    TX_EXPLORER,
    SYMBOL,
    VAULT_MANAGER,
    VAULT_ABI
} = require('../ABI');

// Load wallets
const walletsPath = path.join(__dirname, '../../../wallets.json');
const walletsData = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomFloat = (min, max, decimals) => {
    const num = Math.random() * (max - min) + min;
    return parseFloat(num.toFixed(decimals));
};

const stakeTokensForWallet = async (walletInfo) => {
    const { wallet: walletAddress, privateKey } = walletInfo;
    const walletSigner = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(VAULT_MANAGER, VAULT_ABI, walletSigner);

    try {
        const balanceWei = await provider.getBalance(walletAddress);
        const balanceBERA = parseFloat(ethers.utils.formatEther(balanceWei));

        const stakePercentage = getRandomFloat(15, 30, 2);
        const stakeAmountBERA = parseFloat(((stakePercentage / 100) * balanceBERA).toFixed(2));

        if (stakeAmountBERA <= 0) {
            console.log(`🟡 Wallet: ${walletAddress} has insufficient BERA balance to stake.`);
            return;
        }

        const stakeAmountWei = ethers.utils.parseEther(stakeAmountBERA.toString());
        const gasLimit = getRandomInt(150000, 250000);

        const txOptions = {
            gasLimit: gasLimit,
            maxFeePerGas: ethers.utils.parseUnits('10', 'gwei'),
            maxPriorityFeePerGas: ethers.utils.parseUnits('10', 'gwei')
        };

        const stakeParameter = "0x0000000000000000000000000000000000000000";

        console.log(`🔒 Wallet Address: ${walletAddress} will stake ${stakeAmountBERA} ${SYMBOL}`);
        
        const tx = await contract.stake(stakeParameter, {
            ...txOptions,
            value: stakeAmountWei
        });

        console.log(`📤 Tx Hash Sent for Wallet ${walletAddress}: ${TX_EXPLORER}${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`✅ Tx Confirmed in block number: [${receipt.blockNumber}] for wallet: ${walletAddress}`);
    } catch (error) {
        console.error(`❌ Error during staking for wallet ${walletAddress}:`, error);
    }
};

async function processWallets(walletsToProcess) {
    const BATCH_SIZE = 10;

    for (let i = 0; i < walletsToProcess.length; i += BATCH_SIZE) {
        const batch = walletsToProcess.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(walletInfo => stakeTokensForWallet(walletInfo)));

        if (i + BATCH_SIZE < walletsToProcess.length) {
            console.log(`⏳ Waiting 5 seconds before processing the next batch...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    console.log("🏁 All batches processed!");
}

async function main() {
    console.log("Insert your option:");
    console.log("1. Run custom workflow");
    console.log("2. Run normal workflow");
    const option = readlineSync.question("Please Insert your Option: ");

    let walletsToProcess;

    if (option === '1') {
        const input = readlineSync.question("Please insert the Wallet IDs separated by spaces: ");
        const ids = input.split(' ').map(id => id.trim()).filter(id => id !== '');

        const selectedWallets = [];
        for (const id of ids) {
            const found = walletsData.find(w => w.id.toString() === id);
            if (found) {
                selectedWallets.push(found);
            }
        }

        if (selectedWallets.length === 0) {
            console.log("⚠️ No wallets found with the provided IDs.");
            return;
        }

        console.log("Selected Wallets:");
        for (const w of selectedWallets) {
            const balanceWei = await provider.getBalance(w.wallet);
            const balanceBERA = parseFloat(ethers.utils.formatEther(balanceWei)).toFixed(4);
            console.log(`Wallet ID ${w.id} - [${w.wallet}] - [${balanceBERA} ${SYMBOL}]`);
        }

        console.log(`🔧 Custom workflow selected. Processing ${selectedWallets.length} wallet(s).`);
        walletsToProcess = selectedWallets;
        await processWallets(walletsToProcess);

    } else {
        console.log("🔄 Normal workflow selected. Processing all wallets in batches of 10.");
        walletsToProcess = walletsData;
        await processWallets(walletsToProcess);
    }
}

module.exports = {
    main,
    processWallets,
    stakeTokensForWallet
};
