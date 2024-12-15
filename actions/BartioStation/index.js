// BerachainTestnet/actions/BartioStation/index.js

const clear = require('console-clear');
const readlineSync = require('readline-sync');

clear();

console.log("What would you like to do in BeraStation?");
console.log("1. Claim BGT Farming Rewards");
console.log("2. Manage Validator Delegations\n");

const choice = readlineSync.question("Insert your choice: ");

if (choice === '1') {
    require('./scripts/claim_rewards.js');
} else if (choice === '2') {
    require('./scripts/delegations.js');
} else {
    console.error("❌ Invalid choice. Please run the script again and select either 1 or 2.");
    process.exit(1);
}
