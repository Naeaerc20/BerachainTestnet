// ABI.js

// Address of Kodiak Router
const KODIAK_ROUTER_ADDRESS = "0x496e305c03909ae382974caca4c580e1bf32afbe";

// ABI for the swapExactTokensForTokens function
const SECONDARY_ABI = [
  {
    "name": "swapExactTokensForTokens",
    "type": "function",
    "inputs": [
      { "name": "amountIn", "type": "uint256" },
      { "name": "amountOutMin", "type": "uint256" },
      { "name": "path", "type": "address[]" },
      { "name": "to", "type": "address" }
    ],
    "outputs": [
      { "name": "amounts", "type": "uint256[]" }
    ],
    "stateMutability": "nonpayable"
  }
];

// ABI for the multicall function
const PRIMARY_ABI = [
  {
    "name": "multicall",
    "type": "function",
    "inputs": [
      { "name": "previousBlockhash", "type": "bytes32" },
      { "name": "data", "type": "bytes[]" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
];

// ABI for the addLiquidityETH function
const LIQUIDITY_ABI = [
  {
    "name": "addLiquidityETH",
    "type": "function",
    "inputs": [
      { "name": "pool", "type": "address" },
      { "name": "amount0Max", "type": "uint256" },
      { "name": "amount1Max", "type": "uint256" },
      { "name": "amount0Min", "type": "uint256" },
      { "name": "amount1Min", "type": "uint256" },
      { "name": "amountSharesMin", "type": "uint256" },
      { "name": "receiver", "type": "address" }
    ],
    "outputs": [],
    "stateMutability": "payable"
  }
];

// Address of the Liquidity Contract
const LIQUIDITY_CONTRACT_ADDRESS = "0x4d41822c1804ffF5c038E4905cfd1044121e0E85";

// ABI for the stake function
const STAKE_LP_ABI = [
  {
    "name": "stake",
    "type": "function",
    "inputs": [
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "bool" }
    ],
    "stateMutability": "nonpayable"
  }
];

// Address of the Staking LP Contract
const STAKE_LP_CONTRACT = "0x175e2429bCb92643255abCbCDF47Fff63F7990CC";

// RPC URLs
const RPC_URLS = [
  "https://bartio.rpc.berachain.com"
];

// Chain Information
const CHAIN_ID = 80084;
const CHAIN_SYMBOL = "BERA";
const TX_EXPLORER = "https://bartio.beratrail.io/tx/";

// Additional Contract Addresses
const BERA_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // Native Token
const WBERA_CONTRACT_ADDRESS = "0x7507c1dc16935B82698e4C63f2746A2fCf994dF8"; // Wrapped BERA (ERC-20)
const YEET_CONTRACT_ADDRESS = "0x1740F679325ef3686B2f574e392007A92e4BeD41"; // YEET Token (ERC-20)

// ABI for the multiSwap function in BEX Router
const BEX_MULTISWAP_ABI = [
  {
    "name": "multiSwap",
    "type": "function",
    "inputs": [
      {
        "name": "_steps",
        "type": "tuple[]",
        "components": [
          { "name": "poolidx", "type": "uint256" },
          { "name": "tokenA", "type": "address" },
          { "name": "tokenB", "type": "address" },
          { "name": "isBuy", "type": "bool" }
        ]
      },
      { "name": "_amount", "type": "uint128" },
      { "name": "_minOut", "type": "uint128" }
    ],
    "outputs": [],
    "stateMutability": "payable"
  }
];

// ABI for the WBERA Contract
const WBERA_ABI = [
  {
    "name": "deposit",
    "type": "function",
    "inputs": [],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "name": "withdraw",
    "type": "function",
    "inputs": [
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
  // Add other functions if necessary
];

// Address of BEX Router
const BEX_ROUTER_ADDRESS = "0x21e2C0AFd058A89FCf7caf3aEA3cB84Ae977B73D";

const ERC20_ABI = [
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",

  // Read functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)", // decimals function
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)", // allowance function

  // Write functions
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)"
];

// Address of KODIAK_LP_MANAGER
const KODIAK_LP_MANAGER_ADDRESS = "0x5E51894694297524581353bc1813073C512852bf";

// ABI for the addLiquidityNative function
const KODIAK_LP_MANAGER_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "island", "type": "address" },
      { "internalType": "uint256", "name": "amount0Max", "type": "uint256" },
      { "internalType": "uint256", "name": "amount1Max", "type": "uint256" },
      { "internalType": "uint256", "name": "amount0Min", "type": "uint256" },
      { "internalType": "uint256", "name": "amount1Min", "type": "uint256" },
      { "internalType": "uint256", "name": "amountSharesMin", "type": "uint256" },
      { "internalType": "address", "name": "receiver", "type": "address" }
    ],
    "name": "addLiquidityNative",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

// Address of the Pool Contract
const POOL_CONTRACT_ADDRESS = "0xE5A2ab5D2fb268E5fF43A5564e44c3309609aFF9";

// ABI for the Pool Contract
const POOL_CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "lowerTick",
    "outputs": [
      {
        "internalType": "int24",
        "name": "",
        "type": "int24"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "upperTick",
    "outputs": [
      {
        "internalType": "int24",
        "name": "",
        "type": "int24"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "slot0",
    "outputs": [
      {
        "internalType": "uint160",
        "name": "sqrtPriceX96",
        "type": "uint160"
      },
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
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
];

module.exports = {
  KODIAK_ROUTER_ADDRESS,
  SECONDARY_ABI,
  PRIMARY_ABI,
  LIQUIDITY_ABI,
  LIQUIDITY_CONTRACT_ADDRESS,
  STAKE_LP_ABI,
  STAKE_LP_CONTRACT,
  RPC_URLS,
  CHAIN_ID,
  CHAIN_SYMBOL,
  TX_EXPLORER,
  BERA_CONTRACT_ADDRESS,
  WBERA_CONTRACT_ADDRESS,
  YEET_CONTRACT_ADDRESS,
  ERC20_ABI,
  BEX_MULTISWAP_ABI,
  BEX_ROUTER_ADDRESS,
  WBERA_ABI,
  KODIAK_LP_MANAGER_ADDRESS,
  KODIAK_LP_MANAGER_ABI,
  POOL_CONTRACT_ADDRESS,
  POOL_CONTRACT_ABI,
};
