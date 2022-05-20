const ethers = require('ethers');
const BigNumber = require('bignumber.js');
const axios = require('axios');

const {
  Finding, FindingSeverity, FindingType, getJsonRpcUrl,
} = require('forta-agent');

// load helper function for loading protocol data
const common = require('./common');

// load agent configuration parameters
const config = require('./agent-config.json');

const WEI_PER_ETHER = new BigNumber(ethers.constants.WeiPerEther.toString());

// set up a variable to hold initialization data used in the handler
const initializeData = {};

// helper function to create alerts
function createAlert(contractName, address, priceSpreadRatio, upper, lower, threshold, timeDelta) {
  return Finding.fromObject({
    name: 'Perp.Fi Price Spread Ratio',
    description: `Price spread ratio for ${contractName} exceeded bounds for ${timeDelta} seconds`,
    alertId: 'AE-PERPFI-PRICE-SPREAD-RATIO',
    protocol: 'Perp.Fi',
    severity: FindingSeverity.Critical,
    type: FindingType.Degraded,
    metadata: {
      contractName,
      address,
      priceSpreadRatio,
      lowerLimit: lower,
      upperLimit: upper,
      timeThreshold: threshold,
      timeExceeded: timeDelta,
    },
  });
}

function provideInitialize(data) {
  return async function initialize() {
    // get configuration data specific to this agent
    /* eslint-disable no-param-reassign */
    data.config = config.priceSpreadRatio;

    // initialize the block timestamp
    data.blockTimestamp = 0;

    // create an ethers provider for calling contract read-only methods
    data.provider = new ethers.providers.JsonRpcProvider(getJsonRpcUrl());

    // get the contract names that we are interested in
    data.contractNames = Object.keys(data.config);

    // load the array of contract addresses, abis, and ethers interfaces
    data.contractsData = common.getContractAddressesAbis(data.contractNames);

    // create an ethers contract object for each contract and store with the other contract data
    // also extract the FTX url corresponding to each address and store it with the contract data
    data.contractsData.forEach((contractData) => {
      // create and store the ethers contract
      contractData.contract = new ethers.Contract(
        contractData.address,
        contractData.contractAbi,
        data.provider,
      );

      // get the FTX url and store it
      contractData.ftxUrl = data.config[contractData.name].ftxUrl;

      // get the upper and lower limits of the price spread ratio and store them as BigNumbers
      const contractName = contractData.name;
      contractData.upperLimitPercent = new BigNumber(data.config[contractName].upperLimitPercent);
      contractData.lowerLimitPercent = new BigNumber(data.config[contractName].lowerLimitPercent);

      // store the time threshold for how long the price spread ratio must be outside the limits
      contractData.timeThresholdSeconds = BigInt(data.config[contractName].timeThresholdSeconds);
    });
    /* eslint-enable no-param-reassign */
  };
}

function provideHandleBlock(data) {
  return async function handleBlock(blockEvent) {
    const findings = [];

    const blockTimestamp = BigInt(blockEvent.block.timestamp);

    // iterate over the contracts of interest to get the current prices
    const promises = data.contractsData.map(async (contractData) => {
      // do not create a finding the first time the handler is run
      // instead, initialize the stored timestamp for this contract
      if (!contractData.lastTimestampInLimits) {
        // eslint-disable-next-line no-param-reassign
        contractData.lastTimestampInLimits = blockTimestamp;
        return;
      }

      const { contract } = contractData;

      // get the price for each asset from the FTX
      let ftxResponse;
      try {
        ftxResponse = await axios.get(contractData.ftxUrl);
      } catch {
        return;
      }

      // if the request was not successful, bail
      if (!ftxResponse.data.success) {
        return;
      }

      // convert price to a BigNumber
      const ftxPriceEth = new BigNumber(ftxResponse.data.result.price);
      // convert price to Wei to compare with price returned by contract method
      const ftxPriceWei = ftxPriceEth.times(WEI_PER_ETHER);

      // get the price for each asset from the contract
      // returned value is an ethers BigNumber
      let perpPrice;
      try {
        perpPrice = await contract.getIndexPrice(0);
      } catch {
        // if we had any errors, bail
        return;
      }

      // convert the price to a BigNumber
      const perpPriceWei = new BigNumber(perpPrice.toString());

      // calculate the price spread ratio
      const priceSpreadRatio = (perpPriceWei.minus(ftxPriceWei)).dividedBy(ftxPriceWei);
      const priceSpreadPercent = priceSpreadRatio.times(100);

      // compare the result to the bounds from the configuration file
      const upperLimit = contractData.upperLimitPercent;
      const lowerLimit = contractData.lowerLimitPercent;
      if ((priceSpreadPercent.lt(lowerLimit)) || (priceSpreadPercent.gt(upperLimit))) {
        // the price spread ratio is outside the limits
        // now check the how long the price spread ratio has been outside the limits
        const timeDelta = blockTimestamp - contractData.lastTimestampInLimits;
        if (timeDelta > contractData.timeThresholdSeconds) {
          // create finding
          findings.push(createAlert(
            contractData.name,
            contractData.address,
            priceSpreadRatio,
            upperLimit,
            lowerLimit,
            contractData.timeThresholdSeconds,
            timeDelta,
          ));
        }
      } else {
        // the price spread ratio is not outside the limits
        // therefore, reset the timestamp for this contract
        // eslint-disable-next-line no-param-reassign
        contractData.lastTimestampInLimits = blockTimestamp;
      }
    });

    // wait for the promises to settle
    await Promise.all(promises);

    return findings;
  };
}

module.exports = {
  createAlert,
  provideHandleBlock,
  handleBlock: provideHandleBlock(initializeData),
  provideInitialize,
  initialize: provideInitialize(initializeData),
};
