const { Finding, FindingSeverity, FindingType } = require('forta-agent');

// load the module containing commonly used helper functions for Perpetual Finance
const common = require('./common');

// load any agent configuration parameters
const config = require('./agent-config.json');

// set up a variable to hold initialization data used in the handler
const initializeData = {};

// get the Array of events for a given contract
function getEvents(contractName, adminEvents) {
  const events = adminEvents[contractName];
  if (events === undefined) {
    return {}; // no events for this contract
  }
  return events;
}

// helper function that identifies key strings in the args array obtained from log parsing
// these key-value pairs will be added to the metadata as event args
// all values are converted to strings so that BigNumbers are readable
function extractEventArgs(args) {
  const eventArgs = {};
  Object.keys(args).forEach((key) => {
    if (Number.isNaN(Number(key))) {
      eventArgs[key] = args[key].toString();
    }
  });
  return eventArgs;
}

// helper function to create alerts
function createAlert(
  eventName,
  contractName,
  contractAddress,
  eventType,
  eventSeverity,
  args,
) {
  const eventArgs = extractEventArgs(args);
  return Finding.fromObject({
    name: 'Perpetual Finance Admin Event',
    description: `The ${eventName} event was emitted by the ${contractName} contract`,
    alertId: 'AE-PERPFI-ADMIN-EVENT',
    type: FindingType[eventType],
    severity: FindingSeverity[eventSeverity],
    protocol: 'Perp.Fi',
    metadata: {
      contractName,
      contractAddress,
      eventName,
      eventArgs,
    },
  });
}

// helper function to filter logs based on contract addresses and event names
function filterAndParseLogs(logs, address, iface, eventNames) {
  // collect logs only from the contracts of interest
  const contractLogs = logs.filter((log) => log.address === address);
  if (contractLogs.length === 0) {
    return [];
  }

  // decode logs and filter on the ones we are interested in
  const parse = (log) => iface.parseLog(log);
  const filter = (log) => eventNames.indexOf(log.name) !== -1;
  const parsedLogs = contractLogs.map(parse).filter(filter);

  return parsedLogs;
}

function provideInitialize(data) {
  return async function initialize() {
    /* eslint-disable no-param-reassign */
    // assign configurable fields
    data.adminEvents = config.adminEvents;

    // get the contract names that have events that we wish to monitor
    const contractNames = Object.keys(data.adminEvents);

    // load the contract addresses, abis, and ethers interfaces
    data.contracts = common.getContractAddressesAbis(contractNames);
    /* eslint-enable no-param-reassign */
  };
}

function provideHandleTransaction(data) {
  return async function handleTransaction(txEvent) {
    const { adminEvents, contracts } = data;
    if (!contracts) throw new Error('handleTransaction called before initialization');

    const findings = [];

    // iterate over each contract name to get the address and events
    contracts.forEach((contract) => {
      // for each contract look up the events of interest
      const events = getEvents(contract.name, adminEvents);
      const eventNames = Object.keys(events);

      // filter down to only the events we want to alert on
      const parsedLogs = filterAndParseLogs(
        txEvent.logs,
        contract.address,
        contract.iface,
        eventNames,
      );

      // alert on each item in parsedLogs
      parsedLogs.forEach((parsedLog) => {
        findings.push(createAlert(
          parsedLog.name,
          contract.name,
          contract.address,
          events[parsedLog.name].type,
          events[parsedLog.name].severity,
          parsedLog.args,
        ));
      });
    });

    return findings;
  };
}

module.exports = {
  provideInitialize,
  initialize: provideInitialize(initializeData),
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(initializeData),
  createAlert,
};
