// BerachainTestnet/actions/BartioStation/scripts/delegations.js

const fs = require('fs');
const path = require('path');
const ethers = require('ethers');
const readline = require('readline');
const inquirer = require('inquirer');
const { CHAIN_ID, RPC_URL, ABI, TX_EXPLORER } = require('../ABI');
const { fetchUserValidatorInformation } = require('./apis');

const VALIDATORS = [
    { name: "Infrared", address: "0x2D764DFeaAc00390c69985631aAA7Cc3fcfaFAfF" },
    { name: "Kodiak", address: "0x0eCBe62654622e14ae882B8c8c65C3f3F54eCcf9" },
    { name: "TheHoneyJar", address: "0x34D023ACa5A227789B45A62D377b5B18A680BE01" },
    { name: "BeraLand", address: "0x35c1e9C7803b47af738f37Beada3c7c35Eed73d4" },
    { name: "TTT", address: "0xB791098b00AD377B220f91d7878d19e441388eD8" },
    { name: "StakeLab", address: "0xC5b889a28950e7F8c1F279f758d8a0ab1C89cC38" }
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => {
    return new Promise(resolve => rl.question(query, resolve));
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const walletsPath = path.join(__dirname, '../../../wallets.json');
let wallets;

try {
    const data = fs.readFileSync(walletsPath, 'utf8');
    wallets = JSON.parse(data);
} catch (error) {
    console.error("❌ Error reading wallets.json:", error.message);
    rl.close();
    process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider(RPC_URL, {
    chainId: CHAIN_ID,
    name: "berachain-testnet"
});

const BGT_ADDRESS = "0xbDa130737BDd9618301681329bF2e46A016ff9Ad";
const bgtContract = new ethers.Contract(BGT_ADDRESS, ABI, provider);

const GAS_LIMIT = 2000000;
const MAX_FEE = ethers.utils.parseUnits('10', 'gwei');
const MAX_PRIORITY = ethers.utils.parseUnits('10', 'gwei');

function findValidatorName(address) {
    const val = VALIDATORS.find(v => v.address.toLowerCase() === address.toLowerCase());
    return val ? val.name : address;
}

async function getUnboostedBalance(walletAddress) {
    return await bgtContract.unboostedBalanceOf(walletAddress);
}

async function delegateTokens(signer, validatorAddress, amount) {
    const contractWithSigner = bgtContract.connect(signer);
    const amountFormatted = Number(ethers.utils.formatUnits(amount, 18)).toFixed(3);
    console.log(`🔗 Delegating tokens to validator: ${findValidatorName(validatorAddress)}, amount: ${amountFormatted} BGT`);

    try {
        const tx = await contractWithSigner.queueBoost(validatorAddress, amount, {
            gasLimit: GAS_LIMIT,
            maxFeePerGas: MAX_FEE,
            maxPriorityFeePerGas: MAX_PRIORITY
        });
        console.log(`✅ Delegation Tx Sent! - ${TX_EXPLORER}${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`📦 Delegation Tx Included In block Number: ${receipt.blockNumber}`);
    } catch (error) {
        if (error.message.includes('insufficient funds for intrinsic transaction cost')) {
            console.error("❌ Insufficient funds for transaction. Skipping this wallet.");
            return 'INSUFFICIENT_FUNDS';
        } else if (error.code === 'CALL_EXCEPTION') {
            console.error("❌ Transaction failed: CALL_EXCEPTION. Skipping this wallet.");
            return 'CALL_EXCEPTION';
        } else {
            console.error(`❌ Failed to delegate to ${findValidatorName(validatorAddress)}: ${error.message}`);
            return 'OTHER_ERROR';
        }
    }
}

async function activateBoost(signer, validatorAddress) {
    const contractWithSigner = bgtContract.connect(signer);
    const validatorName = findValidatorName(validatorAddress);
    console.log(`⚙️  Confirming pending delegations for validator: ${validatorName}`);

    try {
        const tx = await contractWithSigner.activateBoost(validatorAddress, {
            gasLimit: GAS_LIMIT,
            maxFeePerGas: MAX_FEE,
            maxPriorityFeePerGas: MAX_PRIORITY
        });
        console.log(`✅ Activate Delegation Tx Sent! - ${TX_EXPLORER}${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`📦 Activate Delegation Tx Included in Block Number: ${receipt.blockNumber}`);
    } catch (error) {
        if (error.message.includes('insufficient funds for intrinsic transaction cost')) {
            console.error("❌ Insufficient funds for activation transaction. Skipping this activation.");
        } else if (error.code === 'CALL_EXCEPTION') {
            console.error("❌ Activation transaction failed: CALL_EXCEPTION. Skipping this activation.");
        } else {
            console.error(`❌ Failed to activate boost for validator ${validatorName}: ${error.message}`);
        }
    }

    await sleep(500);
}

async function checkPendingBoosts(address) {
    const currentBlock = await provider.getBlockNumber();
    const data = await fetchUserValidatorInformation(address);

    const pending = data.filter(item => {
        const amountQueued = parseFloat(item.amountQueued);
        if (amountQueued > 0) {
            const latestBlock = parseInt(item.latestBlock, 10);
            const targetBlock = latestBlock + 10000;
            return targetBlock < currentBlock;
        }
        return false;
    });

    return pending;
}

async function processManualDelegation() {
    const idInput = await askQuestion("Enter the Wallet ID to use: ");
    const walletId = parseInt(idInput, 10);

    const selectedWallet = wallets.find(w => w.id === walletId);

    if (!selectedWallet) {
        console.error("❌ Wallet ID not found.");
        rl.close();
        process.exit(1);
    }

    const signer = new ethers.Wallet(selectedWallet.privateKey, provider);

    const unboosted = await getUnboostedBalance(selectedWallet.wallet);
    if (unboosted.eq(0)) {
        console.log("⚠️  This wallet has no unboosted BGT available for delegation.");
    } else {
        const validatorChoices = VALIDATORS.map(v => ({ name: v.name, value: v.address }));
        const answers = await inquirer.prompt([{
            type: 'list',
            name: 'validator',
            message: 'Select a validator:',
            choices: validatorChoices
        }]);

        const validatorAddress = answers.validator;

        const delegationResult = await delegateTokens(signer, validatorAddress, unboosted);
        if (delegationResult === 'INSUFFICIENT_FUNDS' || delegationResult === 'CALL_EXCEPTION') {
            rl.close();
            process.exit(1);
        }
    }

    const pending = await checkPendingBoosts(selectedWallet.wallet);
    console.log(`#️⃣  Validators with Pending Confirmations (${pending.length}/${VALIDATORS.length})`);

    for (const info of pending) {
        const valName = findValidatorName(info.coinbase);
        const amountQueuedFormatted = Number(info.amountQueued).toFixed(3);
        console.log(`🔸 Validator: ${valName}, Pending BGT: ${amountQueuedFormatted}`);
        await activateBoost(signer, info.coinbase);
    }

    console.log("✅ Manual delegation completed.");
}

async function processRandomDelegation() {
    console.log("\n🚀 Processing all wallets in batches of 10...\n");

    const batchSize = 10;
    for (let i = 0; i < wallets.length; i += batchSize) {
        const batch = wallets.slice(i, i + batchSize);

        await Promise.all(batch.map(async (wallet) => {
            const signer = new ethers.Wallet(wallet.privateKey, provider);
            const unboosted = await getUnboostedBalance(wallet.wallet);
            if (unboosted.eq(0)) {
                console.log(`⚠️  Wallet ${wallet.wallet} has no unboosted BGT.`);
                return;
            }

            const randomIndex = Math.floor(Math.random() * VALIDATORS.length);
            const validatorAddress = VALIDATORS[randomIndex].address;

            const delegationResult = await delegateTokens(signer, validatorAddress, unboosted);
            if (delegationResult === 'INSUFFICIENT_FUNDS') {
                console.log(`⚠️  Skipping wallet ${wallet.wallet} due to insufficient funds.`);
            }
            if (delegationResult === 'CALL_EXCEPTION' || delegationResult === 'OTHER_ERROR') {
                console.log(`⚠️  Skipping wallet ${wallet.wallet} due to a transaction error.`);
            }

            await sleep(500);
        }));

        const pendingArray = await Promise.all(batch.map(async (wallet) => {
            const pending = await checkPendingBoosts(wallet.wallet);
            return { wallet: wallet.wallet, pending: pending };
        }));

        await Promise.all(pendingArray.map(async (item) => {
            if (item.pending.length > 0) {
                const signer = new ethers.Wallet(wallets.find(w => w.wallet === item.wallet).privateKey, provider);
                console.log(`Validators with Pending Confirmations (${item.pending.length}/${VALIDATORS.length}) for wallet ${item.wallet}`);
                await Promise.all(item.pending.map(async (info) => {
                    const valName = findValidatorName(info.coinbase);
                    const amountQueuedFormatted = Number(info.amountQueued).toFixed(3);
                    console.log(`🔸 Validator: ${valName}, Pending BGT: ${amountQueuedFormatted}`);
                    await activateBoost(signer, info.coinbase);
                    await sleep(500);
                }));
            } else {
                console.log(`✅ No pending delegations for wallet ${item.wallet}.`);
            }
        }));

        console.log(`\n📦 Processed batch ${Math.floor(i / batchSize) + 1}\n`);
    }

    console.log("✅ All wallets processed with random delegation.");
}

(async () => {
    console.log("How would you like to perform delegations?");
    console.log("1. Manual Delegation");
    console.log("2. Random Delegation\n");

    const choice = await askQuestion("Please enter your choice (1 or 2): ");

    if (choice === '1') {
        await processManualDelegation();
    } else if (choice === '2') {
        await processRandomDelegation();
    } else {
        console.error("❌ Invalid choice. Run the script again and select either 1 or 2.");
    }

    rl.close();
    process.exit(0);
})();
