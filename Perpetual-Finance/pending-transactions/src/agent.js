const ethers = require('ethers');

const {
  Finding, FindingSeverity, FindingType, getJsonRpcUrl,
} = require('forta-agent');

// load agent configuration parameters
const config = require('./agent-config.json');

// load account addresses to monitor
const accountAddresses = require('./account-addresses.json');

// convert value to BigInt type
const NANOSECONDS_PER_SECOND = BigInt(1e9);

// helper function to create alerts
function createAlert(accountName, accountAddress, numPending) {
  return Finding.fromObject({
    name: 'Perp.Fi High Pending Transaction Count',
    description: `The ${accountName} account had ${numPending} pending transactions in one minute`,
    alertId: 'AE-PERPFI-HIGH-PENDING-TX',
    protocol: 'Perp.Fi',
    severity: FindingSeverity.Critical,
    type: FindingType.Degraded,
    metadata: {
      accountName,
      accountAddress,
      numPending,
    },
  });
}

// initialization data Object
const initializeData = {};

function provideInitialize(data) {
  return async function initialize() {
    // initialize the object that will track pending transactions for the addresses of interest
    const accountPendingTx = {};
    (Object.keys(accountAddresses)).forEach((name) => {
      const address = accountAddresses[name];
      accountPendingTx[address] = {
        name,
        transactions: [],
      };
    });

    /* eslint-disable no-param-reassign */
    data.config = config.pendingTransactions;
    data.config.TIME_WINDOW_SECONDS = BigInt(data.config.timeWindowSeconds);
    data.config.TX_THRESHOLD = data.config.txThreshold;

    // store the accounts information in the data argument
    data.accountPendingTx = accountPendingTx;

    // initialize the array of pending transactions
    data.pendingTransactions = [];

    // initialize the block timestamp
    data.blockTimestamp = 0;

    // reset the start time value to correctly calculate time offsets between block timestamps
    // NOTE: use process.hrtime.bigint to ensure monotonically increasing timestamps
    data.startTime = process.hrtime.bigint();

    // set up an ethers provider to retrieve pending blocks
    if (!data.provider) {
      data.provider = new ethers.providers.JsonRpcProvider(getJsonRpcUrl());
    }
    /* eslint-enable no-param-reassign */

    // register a function with the ethers provider to count pending transactions as they occur
    data.provider.on('pending', (tx) => {
      // only keep transactions from the addresses of interest
      if ((Object.keys(data.accountPendingTx)).indexOf(tx.from) !== -1) {
        // this function will execute whenever the JSON-RPC provider sends a pending transaction
        if (data.blockTimestamp !== 0) {
          const deltaTime = (process.hrtime.bigint() - data.startTime) / NANOSECONDS_PER_SECOND;
          data.pendingTransactions.push({
            timestamp: data.blockTimestamp + deltaTime,
            hash: tx.hash,
            from: tx.from,
          });
        }
      }
    });
  };
}

function provideHandleBlock(data) {
  return async function handleBlock(blockEvent) {
    const findings = [];

    // get the array of transaction hashes that were processed as part of this block
    // these transaction hashes will be checked against our array of pending transactions to remove
    // any that have been successfully processed
    const { transactions: blockTxs } = blockEvent.block;

    // update the timestamp with each block that arrives
    // the block timestamp will be set with each new blockEvent
    // to obtain better time resolution than the block timestamp (which is only expected to be
    // updated every 15 seconds or so), a local start time will be set when each blockEvent occurs
    // that local start time value will then be used to calculate a time offset after each block
    // timestamp whenever a pending transaction occurs
    /* eslint-disable no-param-reassign */
    data.blockTimestamp = BigInt(blockEvent.block.timestamp);
    data.startTime = process.hrtime.bigint();
    /* eslint-enable no-param-reassign */

    // process the transactions from the pendingTransactions array
    let numTransactionsProcessed = 0;
    data.pendingTransactions.forEach((transaction) => {
      // add the transaction timestamp to the appropriate array
      data.accountPendingTx[transaction.from].transactions.push({
        timestamp: transaction.timestamp,
        hash: transaction.hash,
      });
      numTransactionsProcessed++;
    });

    // remove the pending transactions that were processed
    for (let i = 0; i < numTransactionsProcessed; i++) {
      data.pendingTransactions.shift();
    }

    // filter out any transactions that are no longer pending (they appear in a mined block)
    (Object.keys(data.accountPendingTx)).forEach((address) => {
      const txs = data.accountPendingTx[address].transactions;
      // eslint-disable-next-line no-param-reassign
      data.accountPendingTx[address].transactions = txs.filter(
        (tx) => blockTxs.indexOf(tx.hash) === -1,
      );
    });

    // iterate over stored pending transactions to count how many have occurred in the specified
    // duration
    (Object.keys(data.accountPendingTx)).forEach((address) => {
      while (data.accountPendingTx[address].transactions.length > 0) {
        const { timestamp } = data.accountPendingTx[address].transactions[0];
        const accountName = data.accountPendingTx[address].name;

        if (timestamp < (data.blockTimestamp - data.config.TIME_WINDOW_SECONDS)) {
          // the timestamp is outside the window, remove the transaction
          data.accountPendingTx[address].transactions.pop();
        } else {
          // check the number of pending transactions
          // if it is over our threshold, create an alert and add it to the findings array
          const numPending = data.accountPendingTx[address].transactions.length;

          if (numPending > data.config.txThreshold) {
            findings.push(createAlert(accountName, address, numPending));

            // clear the pending transactions array to avoid firing multiple alerts for the same
            // condition
            // eslint-disable-next-line no-param-reassign
            data.accountPendingTx[address].transactions = [];
          }
          break;
        }
      }
    });
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
