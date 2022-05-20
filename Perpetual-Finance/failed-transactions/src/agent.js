const {
  Finding, FindingSeverity, FindingType, getTransactionReceipt
} = require('forta-agent');

// addresses we are interested in monitoring
const accountAddresses = require('./account-addresses.json');

const config = require('./agent-config.json');

const initializeData = {};

// formats provided data into a Forta alert
function createAlert(name, address, failedTxs, blockWindow) {
  return Finding.fromObject({
    name: 'Perp.Fi Failed Transactions Alert',
    description: `${name} has sent ${failedTxs.length} failed transactions `
    + `in the past ${blockWindow} blocks`,
    protocol: 'Perp.Fi',
    alertId: 'AE-PERPFI-FAILED-TRANSACTIONS',
    severity: FindingSeverity.Critical,
    type: FindingType.Info,
    metadata: {
      name,
      address,
      failedTxs,
    },
  });
}

function provideHandleTransaction(data, getTransactionReceipt) {
  /**
   * data is expected to have:
   *  - addresses (object of name:address entries we are interested in)
   *  - failedTxs (object to hold failed txs)
   *  - blockWindow (config of how many blocks we should look for failed txs)
   *  - failedTxLimit (how many failed txs required to raise an alert)
   */
  return async function handleTransaction(txEvent) {
    const {
      blockWindow, addresses, failedTxs, failedTxLimit,
    } = data;
    if (!addresses) throw new Error('called handler before initializing');

    const findings = [];

    // we are only interested in failed transactions
    const { status } = await getTransactionReceipt(txEvent.hash)

    if (status) {
      return findings;
    }

    // check each watched address to see if it failed
    Object.entries(addresses).forEach(([name, address]) => {
      // skip addresses we are not interested in
      if (txEvent.from !== address) return;

      // add new occurrence
      failedTxs[name][txEvent.hash] = txEvent.blockNumber;

      // filter out occurrences older than blockWindow
      Object.entries(failedTxs[name]).forEach(([hash, blockNumber]) => {
        if (blockNumber < txEvent.blockNumber - blockWindow) {
          delete failedTxs[name][hash];
        }
      });

      // create finding if there are too many failed txs
      if (Object.keys(failedTxs[name]).length >= failedTxLimit) {
        findings.push(
          createAlert(name, address, Object.keys(failedTxs[name]), blockWindow),
        );

        // if we raised an alert, clear out the array of failed transactions to avoid over-alerting
        failedTxs[name] = {};
      }
    });
    return findings;
  };
}

function provideInitialize(data) {
  return async function initialize() {
    /* eslint-disable no-param-reassign */
    data.addresses = {};
    data.failedTxs = {};

    // add all addresses we will watch as lower case and initialize failed tx object
    Object.entries(accountAddresses).forEach(([name, address]) => {
      data.addresses[name] = address.toLowerCase();
      data.failedTxs[name] = {};
    });

    // assign configurable fields
    data.blockWindow = config.failedTransactions.blockWindow;
    data.failedTxLimit = config.failedTransactions.failedTxLimit;
    /* eslint-enable no-param-reassign */
  };
}

module.exports = {
  provideInitialize,
  initialize: provideInitialize(initializeData),
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(initializeData, getTransactionReceipt),
  createAlert,
};
