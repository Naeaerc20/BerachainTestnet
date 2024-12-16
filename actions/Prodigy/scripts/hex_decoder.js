// hex_decoder.js

const ethers = require('ethers');
const readline = require('readline');

// Configuración del proveedor
const RPC_URL = 'https://bartio.rpc.berachain.com'; // Asegúrate de que el protocolo sea correcto (http o https)
const CHAIN_ID = 80084;

// ABI mínima para interactuar con la función 'earned' y 'decimals' (si aplica)
const ABI = [
    // Función 'earned(address)'
    {
        "constant": true,
        "inputs": [
            {
                "name": "account",
                "type": "address"
            }
        ],
        "name": "earned",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    // Función 'decimals()' (opcional, para obtener los decimales del token)
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "name": "",
                "type": "uint8"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];

// Configuración de la interfaz de línea de comandos
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Función para solicitar entrada del usuario
const askQuestion = (query) => {
    return new Promise(resolve => rl.question(query, resolve));
};

(async () => {
    try {
        console.log("=== Hex Decoder para la función 'earned' ===\n");

        // Solicitar Private Key
        const privateKey = await askQuestion("Ingresa tu Private Key (sin 0x): ");
        // Validar Private Key
        if (!/^([A-Fa-f0-9]{64})$/.test(privateKey)) {
            throw new Error("Private Key inválida. Asegúrate de que tenga 64 caracteres hexadecimales.");
        }

        // Solicitar Wallet Address
        const walletAddress = await askQuestion("Ingresa tu Wallet Address: ");
        // Validar dirección
        if (!ethers.utils.isAddress(walletAddress)) {
            throw new Error("Dirección de Wallet inválida.");
        }

        // Solicitar Dirección del Contrato
        const contractAddress = await askQuestion("Ingresa la dirección del Contrato: ");
        // Validar dirección del contrato
        if (!ethers.utils.isAddress(contractAddress)) {
            throw new Error("Dirección de Contrato inválida.");
        }

        rl.close();

        // Configurar el proveedor
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL, {
            chainId: CHAIN_ID,
            name: "custom-chain"
        });

        // Crear una wallet (aunque no se usará para llamadas de lectura)
        const wallet = new ethers.Wallet(privateKey, provider);

        // Instanciar el contrato
        const contract = new ethers.Contract(contractAddress, ABI, provider);

        // Llamar a la función 'earned' con la dirección proporcionada
        console.log("\nLlamando a la función 'earned'...");

        const earnedRaw = await contract.earned(walletAddress);
        console.log(`Valor en formato hexadecimal: ${earnedRaw.toHexString()}`);

        // Convertir a decimal
        const earnedDecimal = earnedRaw.toString();
        console.log(`Valor en formato decimal: ${earnedDecimal}`);

        // Intentar obtener los decimales del token
        let decimals = 18; // Valor por defecto
        try {
            decimals = await contract.decimals();
            console.log(`Decimales del token: ${decimals}`);
        } catch (error) {
            console.warn("No se pudo obtener la función 'decimals'. Se usará 18 por defecto.");
        }

        // Calcular el valor legible
        const earnedReadable = ethers.utils.formatUnits(earnedDecimal, decimals);
        console.log(`Valor legible: ${earnedReadable}`);

    } catch (error) {
        console.error(`\nError: ${error.message}`);
        rl.close();
        process.exit(1);
    }
})();
