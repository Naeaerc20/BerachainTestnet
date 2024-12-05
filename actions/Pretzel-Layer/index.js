// BerachainTestnet/actions/Pretzel-Layer/index.js

const { getAccountData } = require('./apis.js');

const main = async () => {
  try {
    const walletId = 1; // Change as needed
    const data = await getAccountData(walletId);
    
    // Process the data as required
    console.log('Account Data:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

main();
