// BerachainTestnet/actions/BartioStation/ABI.js

// Variables de Entorno
const TX_EXPLORER = "https://bartio.beratrail.io/tx/";
const CHAIN_ID = 80084;
const RPC_URL = "https://berachain-bartio.g.alchemy.com/v2/t_qjVdhjAo-ygO6wAiQIu_bOiJ7BopN5";

// ABI Completo del Contrato BGT con las funciones y eventos necesarios
const ABI = [
    {
        "constant": false,
        "inputs": [
            {
                "name": "game",
                "type": "address"
            }
        ],
        "name": "getReward",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
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
    // Función: queuedBoost(address account)
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "queuedBoost",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // Función: numCheckpoints(address account)
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "numCheckpoints",
        "outputs": [
            {
                "internalType": "uint32",
                "name": "",
                "type": "uint32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // Función: boostedQueue(address account, uint32 pos)
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "internalType": "uint32",
                "name": "pos",
                "type": "uint32"
            }
        ],
        "name": "boostedQueue",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint32",
                        "name": "blockNumberLast",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint128",
                        "name": "balance",
                        "type": "uint128"
                    }
                ],
                "internalType": "struct Checkpoints.Checkpoint208",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // Función: boosted(address account, address validator)
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "validator",
                "type": "address"
            }
        ],
        "name": "boosted",
        "outputs": [
            {
                "internalType": "uint128",
                "name": "",
                "type": "uint128"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // Función: boosts(address account)
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "boosts",
        "outputs": [
            {
                "internalType": "uint128",
                "name": "",
                "type": "uint128"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // Función: unboostedBalanceOf(address account)
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "unboostedBalanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // Función: activateBoost(address validator)
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "validator",
                "type": "address"
            }
        ],
        "name": "activateBoost",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // Función: queueBoost(address validator, uint128 amount)
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "validator",
                "type": "address"
            },
            {
                "internalType": "uint128",
                "name": "amount",
                "type": "uint128"
            }
        ],
        "name": "queueBoost",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // Evento: QueueBoost(address sender, address validator, uint128 amount)
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "validator",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint128",
                "name": "amount",
                "type": "uint128"
            }
        ],
        "name": "QueueBoost",
        "type": "event"
    },
    // Evento: ActivateBoost(address sender, address validator)
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "validator",
                "type": "address"
            }
        ],
        "name": "ActivateBoost",
        "type": "event"
    }
];

// Exportar las variables y el ABI para su uso en otros módulos
module.exports = {
    TX_EXPLORER,
    CHAIN_ID,
    RPC_URL,
    ABI
};
