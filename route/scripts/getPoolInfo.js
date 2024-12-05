const axios = require('axios');

const url = 'https://api.goldsky.com/api/public/project_clpx84oel0al201r78jsl0r3i/subgraphs/kodiak-v3-berachain-bartio/latest/gn';

const headers = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
};

const query = `
  fragment TokenFields on Token {
    id
    symbol
    name
    decimals
    totalSupply
    volume
    volumeUSD
    untrackedVolumeUSD
    feesUSD
    txCount
    poolCount
    totalValueLocked
    totalValueLockedUSD
    totalValueLockedUSDUntracked
    derivedETH
  }

  fragment PoolFields on Pool {
    id
    createdAtTimestamp
    createdAtBlockNumber
    feeTier
    liquidity
    sqrtPrice
    feeGrowthGlobal0X128
    feeGrowthGlobal1X128
    token0Price
    token1Price
    tick
    observationIndex
    volumeToken0
    volumeToken1
    volumeUSD
    untrackedVolumeUSD
    feesUSD
    txCount
    collectedFeesToken0
    collectedFeesToken1
    collectedFeesUSD
    totalValueLockedToken0
    totalValueLockedToken1
    totalValueLockedETH
    totalValueLockedUSD
    totalValueLockedUSDUntracked
    liquidityProviderCount
  }

  query getIslandById($id: ID!) {
    kodiakVault(id: $id) {
      id
      name
      symbol
      depositLimit
      createdTimestamp
      createdBlockNumber
      totalValueLockedUSD
      cumulativeSupplySideRevenueUSD
      cumulativeProtocolSideRevenueUSD
      lowerTick
      upperTick
      cumulativeTotalRevenueUSD
      inputTokenBalance
      outputTokenSupply
      outputTokenPriceUSD
      pricePerShare
      stakedOutputTokenAmount
      rewardTokenEmissionsAmount
      rewardTokenEmissionsUSD
      volumeToken0
      volumeToken1
      volumeUSD
      _token0Amount
      _token1Amount
      _token0AmountUSD
      _token1AmountUSD
      _token0 {
        ...TokenFields
      }
      _token1 {
        ...TokenFields
      }

      inputToken {
        ...TokenFields
      }
      outputToken {
        ...TokenFields
      }
      rewardTokens {
        token {
          ...TokenFields
        }
        type
      }

      fees {
        id
        feePercentage
        feeType
      }
      pool {
        ...PoolFields
      }
      apr {
        id
        averageApr
        timestamp
      }
      dailySnapshots {
        timestamp
        volumeUSD
        totalValueLockedUSD
      }
    }
  }
`;

const variables = {
  id: '0xe5a2ab5d2fb268e5ff43a5564e44c3309609aff9'
};

const body = {
  query: query,
  variables: variables
};

axios.post(url, body, { headers: headers })
  .then(response => {
    console.log(JSON.stringify(response.data, null, 2));
  })
  .catch(error => {
    console.error('Error:', error);
  });
