// ABI.js

const ABI = [
  {
    "name": "swapExactETHForTokens",
    "type": "function",
    "stateMutability": "payable",
    "inputs": [
      {
        "name": "amountOutMin",
        "type": "uint256"
      },
      {
        "name": "path",
        "type": "address[]"
      },
      {
        "name": "to",
        "type": "address"
      },
      {
        "name": "deadline",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "amounts",
        "type": "uint256[]"
      }
    ]
  },
  {
    "name": "swapExactTokensForTokens",
    "type": "function",
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "name": "amountIn",
        "type": "uint256"
      },
      {
        "name": "amountOutMin",
        "type": "uint256"
      },
      {
        "name": "path",
        "type": "address[]"
      },
      {
        "name": "to",
        "type": "address"
      },
      {
        "name": "deadline",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "amounts",
        "type": "uint256[]"
      }
    ]
  },
  {
    "name": "swapExactTokensForETH",
    "type": "function",
    "stateMutability": "nonpayable",
    "inputs": [
      {
        "name": "amountIn",
        "type": "uint256"
      },
      {
        "name": "amountOutMin",
        "type": "uint256"
      },
      {
        "name": "path",
        "type": "address[]"
      },
      {
        "name": "to",
        "type": "address"
      },
      {
        "name": "deadline",
        "type": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "amounts",
        "type": "uint256[]"
      }
    ]
  }
];

const BERASWAP_ROUTER = "0x0468f03624A0b36614F34F7Fa3b615e9F39E70E2";

const RPC_URL = "https://bartio.rpc.berachain.com";

const CHAIN_ID = 80084;

const TX_EXPLORER = "https://bartio.beratrail.io/tx/";

const SYMBOL = "BERA";

module.exports = {
  ABI,
  BERASWAP_ROUTER,
  RPC_URL,
  CHAIN_ID,
  TX_EXPLORER,
  SYMBOL
};
