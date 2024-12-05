// ABI.js

// Configuración de la red
export const RPC_URL = 'https://bartio.rpc.berachain.com';
export const CHAIN_ID = 80084;
export const SYMBOL = 'BERA';
export const TX_EXPLORER = 'https://bartio.beratrail.io/tx/';

// Dirección de los contratos
export const BRIDGE_BACK_CONTRACT = '0x7B108A381ea4B9A3E7247a6e765c324CbF94Bd7c';
export const BRIDGE_FROM_CONTRACT = '0xC4555f8Fd652FECC01DbbF9a64bf1819b0a4A695';

// ABI del contrato BridgeBack
export const BRIDGE_BACK_ABI = [
  {
    "constant": false,
    "inputs": [
      {
        "internalType": "bytes32[]",
        "name": "proof",
        "type": "bytes32[]"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "l2Sender",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "l2Block",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "l1Block",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "l2Timestamp",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "executeTransaction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// ABI del contrato BridgeFrom
export const BRIDGE_FROM_ABI = [
  {
    "constant": false,
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "l2CallValue",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxSubmissionCost",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "excessFeeRefundAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "callValueRefundAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "gasLimit",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxFeePerGas",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "createRetryableTicket",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
