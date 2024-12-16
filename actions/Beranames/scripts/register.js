const { ethers } = require("ethers");
const readlineSync = require("readline-sync");
const { ABI, REGISTER_CONTRACT, RPC_URL, CHAIN_ID, TX_EXPLORER } = require("../ABI");
const wallets = require("../../../wallets");

(async () => {
  const walletId = readlineSync.question("On which wallet would you like to register a domain?\nInsert Wallet ID: ");
  const domainName = readlineSync.question("Which domain would you like to register?\nInsert Domain Name: ");

  const selectedWallet = wallets.find(w => w.id == walletId);
  if (!selectedWallet) {
    console.log("Wallet not found.");
    process.exit(1);
  }

  const provider = new ethers.providers.JsonRpcProvider(`https://${RPC_URL}`);
  const signer = new ethers.Wallet(selectedWallet.privateKey, provider);

  const ownerAddress = await signer.getAddress();

  const contract = new ethers.Contract(REGISTER_CONTRACT, ABI, signer);

  const request = {
    name: domainName, 
    owner: ownerAddress, 
    duration: ethers.BigNumber.from("31536000"), // 1 year in seconds
    resolver: "0x34Bb7CC576FA4B5f31f984a65dDB7Ff78b8Ecbe0", 
    data: [], 
    reverseRecord: false,
    referrer: "0x0000000000000000000000000000000000000000"
  };

  try {
    const tx = await contract.register(request, { value: ethers.utils.parseEther("0.1") });
    console.log(`Transaction sent: ${tx.hash}`);
    console.log(`Track at: ${TX_EXPLORER}${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
    console.log(`Domain '${domainName}' registered for owner: ${ownerAddress}`);
  } catch (error) {
    console.error("Error registering domain:", error);
  }
})();
