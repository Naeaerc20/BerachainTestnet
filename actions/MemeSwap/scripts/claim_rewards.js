// BerachainTestnet/actions/MemeSwap/scripts/claim_rewards.js

const fs = require('fs');
const path = require('path');
const readlineSync = require('readline-sync'); 
const { ethers } = require('ethers');
const {
    RPC_URL,
    VAULT_MANAGER,
    VAULT_ABI,
    TX_EXPLORER
} = require('../ABI');

// Load wallets
const walletsPath = path.join(__dirname, '../../../wallets.json');
const walletsData = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));

// Configuration
const BATCH_SIZE = 10;
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

async function scanWallet(walletInfo) {
    const { wallet: walletAddress, privateKey } = walletInfo;
    const walletSigner = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(VAULT_MANAGER, VAULT_ABI, walletSigner);

    const earnedAmount = await contract.earned(walletAddress);
    return { walletAddress, privateKey, earnedAmount };
}

async function claimRewardsForWallet(walletAddress, privateKey, roundId) {
    const walletSigner = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(VAULT_MANAGER, VAULT_ABI, walletSigner);

    const claimAccount = "0x0000000000000000000000000000000000000000";
    const txOptions = {
        gasLimit: 250000,
        maxFeePerGas: ethers.utils.parseUnits('10', 'gwei'),
        maxPriorityFeePerGas: ethers.utils.parseUnits('10', 'gwei')
    };

    const tx = await contract.claim(roundId, claimAccount, txOptions);
    console.log(`📤 Tx Hash sent for Wallet ${walletAddress} - ${TX_EXPLORER}${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Tx Confirmed in block: [${receipt.blockNumber}] for wallet: ${walletAddress}`);
}

async function processWallets(walletsToProcess) {
    for (let i = 0; i < walletsToProcess.length; i += BATCH_SIZE) {
        const batch = walletsToProcess.slice(i, i + BATCH_SIZE);
        const scanResults = await Promise.all(batch.map(walletInfo => scanWallet(walletInfo)));

        const walletsWithRewards = scanResults.filter(r => r.earnedAmount.gt(0));
        console.log(`🔎 Scanned Wallets with Available Rewards to claim (${walletsWithRewards.length}/${batch.length})`);

        if (walletsWithRewards.length > 0) {
            const walletAddresses = walletsWithRewards.map(w => w.walletAddress);
            console.log(`💰 Claiming Reward for Wallets ${JSON.stringify(walletAddresses)}`);

            await Promise.all(walletsWithRewards.map(async (w) => {
                try {
                    const roundId = w.earnedAmount; 
                    await claimRewardsForWallet(w.walletAddress, w.privateKey, roundId);
                } catch (error) {
                    console.error(`❌ Error claiming for wallet ${w.walletAddress}:`, error);
                }
            }));
        } else {
            console.log(`🔴 No rewards to claim in this batch.`);
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

        walletsToProcess = walletsData.filter(w => ids.includes(w.id.toString()));

        if (walletsToProcess.length === 0) {
            console.log("⚠️ No wallets found with the provided IDs.");
            return;
        }

        console.log(`🔧 Custom workflow selected. Processing ${walletsToProcess.length} wallet(s).`);
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
    claimRewardsForWallet,
    scanWallet
};
