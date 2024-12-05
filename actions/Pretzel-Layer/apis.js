// BerachainTestnet/actions/Pretzel-Layer/apis.js

const axios = require('axios');
const wallets = require('../../wallets.json');

const API_URL = 'https://api.superbridge.app/api/v4/bridge/activity';

const headers = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Content-Type': 'application/json'
};

const getAccountData = async (walletId = 1) => {
  try {
    const walletEntry = wallets.find(wallet => wallet.id === walletId);
    
    if (!walletEntry) {
      throw new Error(`Wallet with ID ${walletId} not found.`);
    }

    const payload = {
      address: walletEntry.wallet,
      acrossDomains: [],
      cctpDomains: [],
      cursor: null,
      deploymentIds: ["64582aba-e79b-4897-800a-24d9a331d83d"],
      hyperlane: {
        mailboxIds: [],
        routers: []
      },
      lz: {
        domainIds: [],
        adapters: []
      }
    };

    const response = await axios.post(API_URL, payload, { headers });

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Error: Status code ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching account data:', error.message);
    throw error;
  }
};

module.exports = {
  getAccountData
};
