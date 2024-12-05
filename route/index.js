// index.js

const readlineSync = require('readline-sync');
const figlet = require('figlet');
const clear = require('console-clear');
const colors = require('colors');  // Importamos colors para agregar color

const { performSwap } = require('./scripts/swap.js');
const { addLiquidity } = require('./scripts/liquidity.js');
const { stakeLP } = require('./scripts/stake-liquidity.js');
const { delegateLP } = require('./scripts/delegate.js');
const { verifyDelegation } = require('./scripts/verify-delegation.js');

// Function to display the banner using figlet
function displayBanner() {
  figlet.text('Berachain CLI', {
    font: 'Standard', // Puedes elegir otras fuentes disponibles en figlet
    horizontalLayout: 'default',
    verticalLayout: 'default',
  }, function(err, data) {
    if (err) {
      console.log('Something went wrong with figlet...');
      console.dir(err);
      return;
    }

    // Color green for the banner text using colors
    console.log(data.yellow);

    // Add the custom message below the banner
    console.log(colors.yellow('\n👑 This tool has been created by Naeaex'));
    console.log(colors.yellow('🛜  Follow my Socials: x.com/naeaexeth - www.github.com/Naeaerc20\n'));
  });
}

// Function to display the menu and handle user selection
async function showMenu() {
  const option = readlineSync.question('Select an option: \n1. Perform Swap\n2. Add Liquidity\n3. Stake LP\n4. Delegate LP Staked\n5. Confirm Delegations\n0. Exit\n> ');

  switch (option) {
    case '1':
      await performSwap();
      break;
    case '2':
      await addLiquidity();
      break;
    case '3':
      await stakeLP();
      break;
    case '4':
      await delegateLP();
      break;
    case '5':
      await verifyDelegation();
      break;
    case '0':
      console.log('Exiting...');
      process.exit(0);
    default:
      console.log('Invalid option. Please try again.');
  }
}

// Main function to run the menu in a loop with banner and console clear
async function main() {
  while (true) {
    clear(); // Clear the console
    displayBanner(); // Display the banner
    // Wait a moment for the banner to render
    await new Promise(resolve => setTimeout(resolve, 1000));
    showMenu();
    // Wait a moment before returning to the menu
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

main();
