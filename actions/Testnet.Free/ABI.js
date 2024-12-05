// BerachainTestnet/actions/Testnet.Free/ABI.js

// Mint Contract Address
const MINT_CONTRACT_ADDRESS = "0x272a7F8D8fA48949b44Dd424551C7CC540C2ff39";

// ABI for the Mint Contract with the "purchase" function
const MINT_CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "quantity",
        "type": "uint256"
      }
    ],
    "name": "purchase",
    "outputs": [],
    "stateMutability": "payable", // Ensures the function is payable
    "type": "function"
  }
];

// Edition Creator Contract Address
const EDITION_CREATOR_ADDRESS = "0x744fC4e7f66b659b0081dE3BbF02aFDCe667c05D";

// EditionCreated Event ABI
const EDITION_CREATED_EVENT = {
  "anonymous": false,
  "inputs": [
    {
      "indexed": false,
      "internalType": "address",
      "name": "collectionAddress",
      "type": "address"
    }
  ],
  "name": "EditionCreated",
  "type": "event"
};

// ABI for the Edition Creator Contract with the "createEdition" function and "EditionCreated" event
const EDITION_CREATOR_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "internalType": "uint64",
        "name": "editionSize",
        "type": "uint64"
      },
      {
        "internalType": "uint16",
        "name": "royaltyBPS",
        "type": "uint16"
      },
      {
        "internalType": "address",
        "name": "fundsRecipient",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "defaultAdmin",
        "type": "address"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "price",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "startTime",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "endTime",
            "type": "uint256"
          }
          // Add more fields as necessary
        ],
        "internalType": "struct SaleConfig",
        "name": "saleConfig",
        "type": "tuple"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "animationURI",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "imageURI",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "isSoulbound",
        "type": "bool"
      }
    ],
    "name": "createEdition",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  EDITION_CREATED_EVENT // Include the EditionCreated event in the ABI
];

// Blockchain Configurations
const RPC_URL = "https://bartio.rpc.berachain.com";
const CHAIN_ID = 80084;
const SYMBOL = "BERA";
const TX_EXPLORER = "https://bartio.beratrail.io/tx/";

module.exports = {
  MINT_CONTRACT_ADDRESS,
  MINT_CONTRACT_ABI,
  EDITION_CREATOR_ADDRESS,
  EDITION_CREATOR_ABI,
  RPC_URL,
  CHAIN_ID,
  SYMBOL,
  TX_EXPLORER
};
