const REGISTER_CONTRACT = "0xccc13A84eC34f3b1FbEF193557a68F9af2173Ab9";
const RPC_URL = "https://bartio.rpc.berachain.com";
const CHAIN_ID = 80084;
const TX_EXPLORER = "https://bartio.beratrail.io/tx/";

const registerFunctionDetailed = {
  "inputs": [
    {
      "components": [
        { "internalType": "string", "name": "name", "type": "string" },
        { "internalType": "address", "name": "owner", "type": "address" },
        { "internalType": "uint256", "name": "duration", "type": "uint256" },
        { "internalType": "address", "name": "resolver", "type": "address" },
        { "internalType": "bytes[]", "name": "data", "type": "bytes[]" },
        { "internalType": "bool", "name": "reverseRecord", "type": "bool" },
        { "internalType": "address", "name": "referrer", "type": "address" }
      ],
      "internalType": "struct RegistrarRequest",
      "name": "request",
      "type": "tuple"
    }
  ],
  "name": "register",
  "outputs": [],
  "stateMutability": "payable",
  "type": "function"
};

const registerFunctionTuple = {
  "inputs": [
    {
      "internalType": "tuple",
      "name": "request",
      "type": "tuple"
    }
  ],
  "name": "register",
  "outputs": [],
  "stateMutability": "payable",
  "type": "function"
};

const ABI = [
  registerFunctionDetailed
];

module.exports = {
  ABI,
  REGISTER_CONTRACT,
  RPC_URL,
  CHAIN_ID,
  TX_EXPLORER
};
