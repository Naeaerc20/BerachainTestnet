// BerachainTestnet/actions/MemeSwap/index.js

const readlineSync = require('readline-sync');
const { main: depositMain } = require('./scripts/deposit_vault');
const { main: claimMain } = require('./scripts/claim_rewards');

async function mainMenu() {
    console.log("What actions would you like to perform on MemeSwap?");
    console.log("1. Deposit In Vault");
    console.log("2. Claim Farming Rewards");
    console.log("3. Launch a Token");
    const option = readlineSync.question("Please Insert your Option: ");

    switch(option) {
        case '1':
            console.log("");  // Agregar espacio de separación
            await depositMain();
            break;
        case '2':
            console.log("");  // Agregar espacio de separación
            await claimMain();
            break;
        case '3':
            console.log("coming soon...");
            break;
        default:
            console.log("Invalid option. Please try again.");
    }
}

mainMenu().catch(console.error);
