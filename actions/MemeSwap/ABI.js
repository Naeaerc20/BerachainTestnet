// BerachainTestnet/actions/MemeSwap/ABI.js

const RPC_URL = "https://bartio.rpc.berachain.com";
const CHAIN_ID = 80084;
const TX_EXPLORER = "https://bartio.beratrail.io/tx/";
const SYMBOL = "BERA";

const VAULT_MANAGER = "0xeec938A59B81e35F5a1DcE882D295703845fd3b4";

const VAULT_ABI = [
    {
        "constant": false,
        "inputs": [
            { "name": "staker", "type": "address" }
        ],
        "name": "stake",
        "outputs": [
            { "name": "", "type": "uint256" }
        ],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            { "name": "roundId", "type": "uint256" },
            { "name": "account", "type": "address" }
        ],
        "name": "claim",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            { "name": "unstakeAmount", "type": "uint256" },
            { "name": "addressFrom", "type": "address" }
        ],
        "name": "withdraw",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // Aquí agregamos la función earned
    {
        "type": "function",
        "name": "earned",
        "inputs": [
            { "name": "_account", "type": "address", "internalType": "address" }
        ],
        "outputs": [
            { "name": "", "type": "uint256", "internalType": "uint256" }
        ],
        "stateMutability": "view"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "name": "staker", "type": "address" },
            { "indexed": false, "name": "amount", "type": "uint256" }
        ],
        "name": "Staked",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "name": "claimer", "type": "address" },
            { "indexed": false, "name": "amount", "type": "uint256" }
        ],
        "name": "Claimed",
        "type": "event"
    }
];

module.exports = {
    RPC_URL,
    CHAIN_ID,
    TX_EXPLORER,
    SYMBOL,
    VAULT_MANAGER,
    VAULT_ABI
};
