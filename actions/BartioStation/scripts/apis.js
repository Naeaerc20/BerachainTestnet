// BerachainTestnet/actions/BartioStation/scripts/apis.js

const axios = require('axios');

const APILink = "https://api.goldsky.com/api/public/project_clq1h5ct0g4a201x18tfte5iv/subgraphs/bgt-staker-subgraph/v1/gn";

async function fetchUserValidatorInformation(address) {
    const payload = {
        operationName: "GetUserValidatorInformation",
        query: `
            query GetUserValidatorInformation($address: String!) {
                userValidatorInformations(where: {user: $address}, first: 1000) {
                    id
                    amountQueued
                    amountDeposited
                    latestBlock
                    user
                    coinbase
                    __typename
                }
            }
        `,
        variables: { address: address }
    };

    try {
        const response = await axios.post(APILink, payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Android 11; Mobile; rv:24.0) Gecko/20100101 Firefox/51.0'
            }
        });

        return response.data.data.userValidatorInformations || [];
    } catch (error) {
        console.error("Error fetching validator information:", error.message);
        return [];
    }
}

module.exports = {
    fetchUserValidatorInformation
};
