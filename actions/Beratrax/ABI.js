// ABI.js

const CHAIN_ID = 80084;
const RPC_URL = 'https://bartio.rpc.berachain.com';

const ZAP_CONTRACT = {
  address: '0xE6687F93F98dcAAb44033ccc0c225640360414e6',
  abi: [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "vault",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "tokenIn",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenInAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "minShares",
          "type": "uint256"
        }
      ],
      "name": "zapIn",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "shares",
          "type": "uint256"
        },
        {
          "components": [
            {
              "internalType": "address",
              "name": "tokens",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "amounts",
              "type": "uint256"
            }
          ],
          "internalType": "struct ReturnedAsset[]",
          "name": "returnedAssets",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "payable",
      "type": "function"
    }
  ]
};

const SPENDER_CONTRACT = {
  address: '0xf3A31AB7e3BD47EDE6CfB03E82781023468c79b2',
  abi: [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
};

const STAKE_CONTRACT = {
  address: '0x8872898bc15a7c610Ccc905DF1f6F623ad1DCc20',
  abi: [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "stake",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
};

module.exports = {
  CHAIN_ID,
  RPC_URL,
  ZAP_CONTRACT,
  SPENDER_CONTRACT,
  STAKE_CONTRACT
};
