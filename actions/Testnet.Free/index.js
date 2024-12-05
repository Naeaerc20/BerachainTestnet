const readlineSync = require('readline-sync');
const clear = require('console-clear');
const mintNFTs = require('./scripts/mint.js');
const launchNFTCollection = require('./scripts/launch.js');

async function mainMenu() {
  while (true) {
    clear(); // Clears the console at the start of each loop

    console.log('Please choose an option:');
    console.log('1. Mint NFTs (mint.js)');
    console.log('2. Launch NFT Collection (launch.js)');
    console.log('0. Exit \n');

    const choice = readlineSync.question('Enter your choice: ');

    switch (choice) {
      case '1':
        clear();
        console.log('Starting the NFT Minting process...\n');
        await mintNFTs();
        readlineSync.question('\nPress Enter to return to the main menu...');
        break;

      case '2':
        clear();
        console.log('Starting the NFT Collection Launch process...\n');
        await launchNFTCollection();
        readlineSync.question('\nPress Enter to return to the main menu...');
        break;

      case '0':
        clear();
        console.log('✅ Exiting the application. Goodbye!');
        process.exit(0);
        break;

      default:
        console.log('❌ Invalid option. Please select a valid menu option.');
        readlineSync.question('\nPress Enter to try again...');
    }
  }
}

mainMenu();
