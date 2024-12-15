// BerachainTestnet/actions/BartioStation/scripts/claim_rewards.js

const fs = require('fs');
const path = require('path');
const ethers = require('ethers');
const readline = require('readline');
const { TX_EXPLORER, CHAIN_ID, RPC_URL, ABI } = require('../ABI');

// Contratos de los Pools y sus Nombres
const POOLS = [
    { name: "HONEY-USDC", address: "0xe3b9B72ba027FD6c514C0e5BA075Ac9c77C23Afa" },
    { name: "HONEY-WBERA", address: "0xAD57d7d39a487C04a44D3522b910421888Fb9C6d" },
    { name: "WEBERA", address: "0x86DA232f6A4d146151755Ccf3e4555eadCc24cCF" },
    { name: "WBERA-YEET", address: "0x175e2429bCb92643255abCbCDF47Fff63F7990CC" }
];

// Configuración de Parámetros de Transacción
const GAS_LIMIT = 2000000;
const MAX_FEE_PER_GAS = ethers.utils.parseUnits('10', 'gwei');
const MAX_PRIORITY_FEE_PER_GAS = ethers.utils.parseUnits('10', 'gwei');

// Inicializar Interfaz de Línea de Comandos
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Función Utilitaria para Solicitar Entrada del Usuario
const askQuestion = (query) => {
    return new Promise(resolve => rl.question(query, resolve));
};

// Función para Dormir/Esperar
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Cargar Wallets desde wallets.json
const walletsPath = path.join(__dirname, '../../../wallets.json');
let wallets;

try {
    const data = fs.readFileSync(walletsPath, 'utf8');
    wallets = JSON.parse(data);
} catch (error) {
    console.error("❌ Error al leer wallets.json:", error.message);
    rl.close();
    process.exit(1);
}

// Función para Procesar Recompensas de una Wallet
const processWallet = async (wallet, contractInstances, provider) => {
    try {
        const signer = new ethers.Wallet(wallet.privateKey, provider);

        // Inicializar Instancias de los Contratos con el Signer
        const contractWithSigner = contractInstances.map(pool => ({
            ...pool,
            contractWithSigner: pool.contract.connect(signer)
        }));

        // Obtener Recompensas Ganadas de Todos los Pools Concurrentemente
        const earnedPromises = contractWithSigner.map(pool => pool.contract.earned(wallet.wallet));
        const earnedResults = await Promise.all(earnedPromises);

        let totalEarned = ethers.BigNumber.from(0);
        let eligiblePools = 0;
        const eligiblePoolIndices = [];

        earnedResults.forEach((earned, index) => {
            const earnedBGT = parseFloat(ethers.utils.formatUnits(earned, 18));
            if (earnedBGT >= 0.005) {
                eligiblePools += 1;
                totalEarned = totalEarned.add(earned);
                eligiblePoolIndices.push(index);
            }
        });

        const totalEarnedFormatted = parseFloat(ethers.utils.formatUnits(totalEarned, 18)).toFixed(3);

        console.log(`\n🔍 Wallet - ${wallet.wallet}`);
        console.log(`💰 Earned ${totalEarnedFormatted} BGT Tokens across ${eligiblePools} Pools`);

        if (eligiblePools > 0) {
            for (const index of eligiblePoolIndices) {
                const pool = contractWithSigner[index];
                try {
                    // **Corrección Aquí**: Pasar la dirección de la wallet al llamar a getReward
                    const tx = await pool.contractWithSigner.getReward(wallet.wallet, {
                        gasLimit: GAS_LIMIT,
                        maxFeePerGas: MAX_FEE_PER_GAS,
                        maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS
                    });
                    console.log(`✅ Claimed from ${POOLS[index].name}: ${TX_EXPLORER}${tx.hash}`);
                    // Esperar a que la transacción sea confirmada
                    await tx.wait();
                    // Esperar 500 ms antes de enviar la siguiente transacción
                    await sleep(500);
                } catch (txError) {
                    // Manejo de Errores: Mensajes Cortos para Errores Específicos
                    if (txError.code === 'CALL_EXCEPTION') {
                        console.error(`❌ Failed to claim from ${POOLS[index].name}: CALL_EXCEPTION`);
                    } else if (txError.message.includes("insufficient funds for intrinsic transaction cost")) {
                        console.error(`❌ Failed to claim from ${POOLS[index].name}: Insufficient Funds`);
                    } else {
                        console.error(`❌ Failed to claim from ${POOLS[index].name}: ${txError.message}`);
                    }
                    // Esperar 500 ms antes de intentar la siguiente transacción
                    await sleep(500);
                }
            }
        } else {
            console.log("⚠️  No eligible rewards to claim.");
        }

    } catch (error) {
        console.error(`❌ Error processing wallet ${wallet.wallet}: ${error.message}`);
    }
};

// Función Principal
(async () => {
    console.log("🎉 Welcome to the BGT Farming Rewards Claimer!\n");
    console.log("Where would you like to claim BGT Farming Rewards?");
    console.log("1. Specific account ID");
    console.log("2. All accounts\n");

    const choice = await askQuestion("Please enter your choice (1 or 2): ");

    if (choice === '1') {
        const idInput = await askQuestion("Enter the Wallet ID to use: ");
        const walletId = parseInt(idInput, 10);

        const selectedWallet = wallets.find(w => w.id === walletId);

        if (!selectedWallet) {
            console.error("❌ Wallet ID not found.");
            rl.close();
            process.exit(1);
        }

        const provider = new ethers.providers.JsonRpcProvider(RPC_URL, {
            chainId: CHAIN_ID,
            name: "berachain-testnet"
        });

        // Inicializar Instancias de los Contratos
        const contractInstances = POOLS.map(pool => {
            const contract = new ethers.Contract(pool.address, ABI, provider);
            return { name: pool.name, address: pool.address, contract };
        });

        await processWallet(selectedWallet, contractInstances, provider);

    } else if (choice === '2') {
        console.log("\n🚀 Processing all wallets in batches of 10...\n");

        const provider = new ethers.providers.JsonRpcProvider(RPC_URL, {
            chainId: CHAIN_ID,
            name: "berachain-testnet"
        });

        // Inicializar Instancias de los Contratos
        const contractInstances = POOLS.map(pool => {
            const contract = new ethers.Contract(pool.address, ABI, provider);
            return { name: pool.name, address: pool.address, contract };
        });

        const batchSize = 10;
        for (let i = 0; i < wallets.length; i += batchSize) {
            const batch = wallets.slice(i, i + batchSize);
            // Procesar cada wallet en la batch simultáneamente
            await Promise.all(batch.map(wallet => processWallet(wallet, contractInstances, provider)));
            console.log(`\n📦 Processed batch ${Math.floor(i / batchSize) + 1}\n`);
        }

        console.log("🎯 All wallets have been processed.");

    } else {
        console.error("❌ Invalid choice. Please run the script again and select either 1 or 2.");
    }

    rl.close();
    process.exit(0);
})();
