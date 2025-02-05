// ABI.js

const ABI = [
  {
    "inputs": [
      {
        "name": "spender",
        "type": "address"
      },
      {
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "name": "owner",
        "type": "address"
      },
      {
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "name": "_to",
        "type": "address"
      }
    ],
    "name": "faucet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "stake",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const RPC_URL = "https://bartio.rpc.berachain.com";
const CHAIN_ID = 80084;
const TX_EXPLORER = "https://bartio.beratrail.io/tx/";
const SYMBOL = "BERA";

const STAKE_CONTRACT = "0x8B97eB703EF7A302b8A5213A48e385489452b56c";
const WAGMI_ADDRESS = "0x157Ab16d344727510E6BC3B294E0824a6a6CAAfD";

module.exports = {
  ABI,
  RPC_URL,
  CHAIN_ID,
  TX_EXPLORER,
  SYMBOL,
  STAKE_CONTRACT,
  WAGMI_ADDRESS
};
