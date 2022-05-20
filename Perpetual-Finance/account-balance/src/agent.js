const BigNumber = require('bignumber.js');
const ethers = require('ethers');
const {
  getJsonRpcUrl, Finding, FindingSeverity, FindingType,
} = require('forta-agent');

const accountAddressesData = require('./account-addresses.json');
const config = require('./agent-config.json');

// Stores information about each account
const initializeData = {};

// Initializes data required for handler
function provideInitialize(data) {
  return async function initialize() {
    /* eslint-disable no-param-reassign */
    // assign configurable fields
    data.alertMinimumIntervalSeconds = config.accountBalance.alertMinimumIntervalSeconds;

    data.provider = new ethers.providers.JsonRpcProvider(getJsonRpcUrl());

    data.accounts = Object.keys(accountAddressesData).map((accountName) => ({
      accountName,
      accountAddress: accountAddressesData[accountName],
      accountThreshold: config.accountBalance.accountThresholds[accountName],
      startTime: 0,
      numAlertsSinceLastFinding: 0,
    }));
    /* eslint-enable no-param-reassign */
  };
}

// helper function to create alerts
function createAlert(accountName, accountAddress, accountBalance,
  thresholdEth, numAlerts) {
  const threshold = ethers.utils.parseEther(thresholdEth.toString());
  return Finding.fromObject({
    name: 'Perp.Fi Low Account Balance',
    description: `The ${accountName} account has a balance below ${thresholdEth} ETH`,
    alertId: 'AE-PERPFI-LOW-ACCOUNT-BALANCE',
    severity: FindingSeverity.Critical,
    type: FindingType.Degraded,
    protocol: 'Perp.Fi',
    metadata: {
      accountName,
      accountAddress,
      accountBalance: accountBalance.toString(),
      threshold: threshold.toString(),
      numAlertsSinceLastFinding: numAlerts.toString(),
    },
  });
}

function provideHandleBlock(data) {
  return async function handleBlock(blockEvent) {
    // upon the mining of a new block, check the specified accounts to make sure the balance of
    // each account has not fallen below the specified threshold
    const findings = [];
    const {
      accounts, provider, alertMinimumIntervalSeconds,
    } = data;
    if (!accounts) {
      throw new Error('handleBlock called before initialization');
    }

    // get the block timestamp
    const blockTimestamp = new BigNumber(blockEvent.block.timestamp);

    await Promise.all(accounts.map(async (account) => {
      const {
        accountName, accountAddress, accountThreshold,
      } = account;
      const accountBalance = await provider.getBalance(accountAddress);

      /* eslint-disable no-param-reassign */
      // If balance < threshold add an alert to the findings
      if (accountBalance < (accountThreshold * 1000000000000000000)) {
        // if less than the specified number of hours has elapsed, just increment the counter for
        // the number of alerts that would have been generated
        if (blockTimestamp.minus(account.startTime) < alertMinimumIntervalSeconds) {
          account.numAlertsSinceLastFinding += 1;
        } else {
          findings.push(createAlert(
            accountName,
            accountAddress,
            accountBalance,
            accountThreshold,
            account.numAlertsSinceLastFinding,
          ));

          // restart the alert counter and update the start time
          account.numAlertsSinceLastFinding = 0;
          account.startTime = new BigNumber(blockTimestamp.toString());
        }
      }
      /* eslint-enable no-param-reassign */
    }));

    return findings;
  };
}

// exports
module.exports = {
  createAlert,
  provideHandleBlock,
  handleBlock: provideHandleBlock(initializeData),
  provideInitialize,
  initialize: provideInitialize(initializeData),
};
