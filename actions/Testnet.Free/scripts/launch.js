const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const readlineSync = require('readline-sync');
const clear = require('console-clear');
const {
  EDITION_CREATOR_ADDRESS,
  EDITION_CREATOR_ABI,
  RPC_URL,
  TX_EXPLORER
} = require('../ABI.js');

/**
 * Reads and parses the wallets.json file.
 * @returns {Array} Array of wallet objects.
 */
function getWallets() {
  const walletsPath = path.join(__dirname, '../../../wallets.json');
  try {
    const data = fs.readFileSync(walletsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading wallets.json:', error.message);
    process.exit(1);
  }
}

/**
 * Reads and parses the collections_created.json file.
 * @returns {Array} Array of collection objects.
 */
function getCollections() {
  const collectionsPath = path.join(__dirname, '../../../collections_created.json');
  if (!fs.existsSync(collectionsPath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(collectionsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading collections_created.json:', error.message);
    process.exit(1);
  }
}

/**
 * Writes the updated collections array to collections_created.json.
 * @param {Array} collections - Array of collection objects.
 */
function saveCollections(collections) {
  const collectionsPath = path.join(__dirname, '../../../collections_created.json');
  try {
    fs.writeFileSync(collectionsPath, JSON.stringify(collections, null, 4), 'utf8');
  } catch (error) {
    console.error('❌ Error writing to collections_created.json:', error.message);
    process.exit(1);
  }
}

/**
 * Converts a given URL or IPFS hash to an ipfs:// URI.
 * @param {string} url - The image URL or IPFS hash.
 * @returns {string} - The converted ipfs:// URI.
 */
function convertToURI(url) {
  // If already in ipfs:// format
  if (url.startsWith('ipfs://')) {
    return url;
  }

  // If it's an IPFS hash (e.g., 'NpM0FGcgEMJCITNnhMFnl5Ul8.avif')
  const hashPattern = /^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)?$/;
  if (hashPattern.test(url)) {
    return `ipfs://${url}`;
  }

  // Attempt to extract IPFS hash from a URL
  const ipfsPattern = /https?:\/\/(?:ipfs\.)?([a-zA-Z0-9]+)\.ipfs\.nftstorage\.link\/(.+)/;
  const match = url.match(ipfsPattern);
  if (match) {
    return `ipfs://${match[2]}`;
  }

  console.warn('⚠️  Please ensure the Image URL is in the correct IPFS format.');
  return url; // Return as is if no pattern matches
}

/**
 * Generates a random gas limit between 700,000 and 1,000,000.
 * @returns {number} - The random gas limit.
 */
function getRandomGasLimit() {
  return Math.floor(Math.random() * (1000000 - 700000 + 1)) + 700000;
}

/**
 * Launches a new NFT collection.
 */
async function launchNFTCollection() {
  clear();

  const wallets = getWallets();
  const collections = getCollections();

  // Prompt user to select a wallet by ID
  const walletId = readlineSync.questionInt('On which wallet would you like to launch an NFT collection? (Enter Wallet ID): ');

  // Find the selected wallet
  const selectedWallet = wallets.find(w => w.id === walletId);
  if (!selectedWallet) {
    console.log('❌ Invalid Wallet ID selected.');
    return;
  }

  console.log(`\nSelected Wallet: ID: ${selectedWallet.id} | Address: ${selectedWallet.wallet}\n`);

  // Prompt for collection details
  const name = readlineSync.question('Enter Collection Name: ');
  const symbol = readlineSync.question('Enter Collection Symbol: ');
  const description = readlineSync.question('Enter Collection Description: ');
  const imageUrl = readlineSync.question('Enter Image URL (IPFS hash or full URL): ');
  const imageURI = convertToURI(imageUrl);

  // Fixed parameters
  const editionSize = "9007199254740991"; // Fixed edition size
  const royaltyBPS = 100; // Fixed royalty in basis points
  const fundsRecipient = selectedWallet.wallet; // Deployer wallet
  const defaultAdmin = selectedWallet.wallet; // Deployer wallet
  const saleConfig = {
    price: 0, // Empty or default values
    startTime: 0,
    endTime: 0
  };
  const animationURI = ""; // Empty string
  const isSoulbound = false; // Set to false

  // Initialize provider and wallet
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(selectedWallet.privateKey, provider);

  // Initialize Edition Creator contract
  const editionCreatorContract = new ethers.Contract(
    EDITION_CREATOR_ADDRESS,
    EDITION_CREATOR_ABI,
    wallet
  );

  try {
    console.log('Launching NFT Collection...\n');

    // Call createEdition function with the specified parameters
    const tx = await editionCreatorContract.createEdition(
      name,
      symbol,
      editionSize,
      royaltyBPS,
      fundsRecipient,
      defaultAdmin,
      saleConfig,
      description,
      animationURI,
      imageURI,
      isSoulbound,
      {
        gasLimit: getRandomGasLimit(),
        maxPriorityFeePerGas: ethers.utils.parseUnits('1', 'gwei'),
        maxFeePerGas: ethers.utils.parseUnits('1', 'gwei')
      }
    );

    console.log(`🟢 Transaction Hash: ${TX_EXPLORER}${tx.hash}`);

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    console.log(`📦 Transaction Confirmed in Block Number: ${receipt.blockNumber}\n`);

    // Extract the newly deployed collection address from events
    let nftCollectionAddress = null;
    const eventAbi = EDITION_CREATOR_ABI.find(
      (item) => item.type === 'event' && item.name === 'EditionCreated'
    );

    if (eventAbi) {
      const iface = new ethers.utils.Interface([eventAbi]);
      const event = receipt.logs
        .map(log => {
          try {
            return iface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find(parsedLog => parsedLog && parsedLog.name === 'EditionCreated');

      if (event) {
        nftCollectionAddress = event.args.collectionAddress;
        console.log(`✅ NFT Collection Deployed at Address: ${nftCollectionAddress}\n`);
      } else {
        console.log('⚠️  EditionCreated event not found in transaction logs.\n');
      }
    } else {
      console.log('⚠️  EditionCreated event ABI not found. Unable to extract collection address.\n');
    }

    if (!nftCollectionAddress) {
      console.log('❌ Failed to retrieve the NFT Collection address.');
      return;
    }

    // Determine the new collection ID for this deployer
    const deployerCollections = collections.filter(c => c.deployer_address.toLowerCase() === selectedWallet.wallet.toLowerCase());
    const newId = deployerCollections.length > 0 ? deployerCollections[deployerCollections.length - 1].id + 1 : 1;

    // Create a new collection entry
    const newCollection = {
      id: newId,
      deployer_address: selectedWallet.wallet,
      nft_collection_address: nftCollectionAddress,
      mint_price: "0.01"
    };

    // Append the new collection to the collections array
    collections.push(newCollection);

    // Save the updated collections array to collections_created.json
    saveCollections(collections);

    console.log('✅ Collection successfully recorded in collections_created.json\n');

  } catch (error) {
    if (error.code === 'CALL_EXCEPTION') {
      console.log(`❌ Transaction failed due to a contract call exception.`);
    } else {
      console.log(`❌ An error occurred: ${error.message}`);
    }
  }
}

module.exports = launchNFTCollection;
