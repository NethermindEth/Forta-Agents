const ethers = require('ethers');
const BigNumber = require('bignumber.js');
const {
  Finding, FindingSeverity, FindingType, getJsonRpcUrl,
} = require('forta-agent');

// load agent config
const config = require('./agent-config.json');

const initializeData = {};

// load account addresses
const accountAddresses = require('./account-addresses.json');

// load contract addresses
const { contracts } = require('./protocol-data.json');

// provide ABI for USDC balanceOf()
const { abi: usdcAbi } = require('./abi/interface/IERC20Metadata.json');

// calculate the percentage change between two BigNumber values
function calcPercentChange(first, second) {
  const delta = second.minus(first);
  return delta.div(first).multipliedBy(100);
}

// helper function to create alerts
function createAlert(address, name, balance, pctChange, blockWindow) {
  return Finding.fromObject({
    name: 'Perp.Fi USDC Balance Change',
    description: `The USDC balance of the ${name} account changed by ${pctChange}% `
    + `in the past ${blockWindow} blocks`,
    alertId: 'AE-PERPFI-USDC-BALANCE-CHANGE',
    protocol: 'Perp.Fi',
    severity: FindingSeverity.Critical,
    type: FindingType.Suspicious,
    metadata: {
      address,
      balance: balance.toString(),
      pctChange: pctChange.toString(),
    },
  });
}

function provideHandleBlock(data) {
  return async function handleBlock() {
    const {
      blockWindow, addresses, changeThresholdPercent, usdcContract,
    } = data;
    if (!addresses) {
      throw new Error('Called handler before initializing');
    }

    const findings = [];

    // update and check balances
    await Promise.all(Object.keys(addresses).map(async (address) => {
      // get balance for each address being monitored
      // Note:  If balanceOf() fails with a CALL_EXCEPTION code, it is likely that the
      //        USDC_ADDRESS is set incorrectly in agent-config.json
      let balance;
      try {
        const balanceEthersBN = await usdcContract.balanceOf(address);

        // convert from ethers BigNumber to JS BigNumber
        balance = new BigNumber(balanceEthersBN.toString());
      } catch (err) {
        console.error(err);
      } finally {
        // if balanceOf() threw an exception, balance will be undefined
        addresses[address].balanceHistory.push(balance);
      }

      // once we see blockWindow+1 blocks, we have enough data to check for a balance change
      //
      // e.g. to check two balances ~1 minute apart, assuming a block interval of ~15 seconds,
      //      we need 5 samples:
      //
      //      balanceHistory = [BAL1, BAL2, BAL3, BAL4, BAL5]
      //
      //      The time between when BAL1 and BAL5 were recorded will be approximately 1 minute
      //
      const sampleSize = addresses[address].balanceHistory.length;
      if (sampleSize === blockWindow + 1) {
        // check each previous balance against the current balance
        let oldBalance;
        for (let i = 0; i < sampleSize - 1; i++) {
          oldBalance = addresses[address].balanceHistory[i];

          // calculate the percentage change in the balance
          // skip the check if we have an 'undefined' value from a failed balanceOf() call
          if ((oldBalance !== undefined) && (balance !== undefined)) {
            const pctChange = calcPercentChange(oldBalance, balance);

            // emit a finding if the USDC funds decreased by more than the threshold
            if (pctChange < (-1 * changeThresholdPercent)) {
              const { name } = addresses[address];
              findings.push(createAlert(address, name, balance, pctChange, blockWindow));

              // don't bother checking any more balances - we don't need to publish a finding
              // for every threshold crossing that happened during this period
              break;
            }
          }
        }

        // update for the next cycle - drop the oldest balance
        addresses[address].balanceHistory.shift();
      }
    }));

    return findings;
  };
}

function provideInitialize(data) {
  return async function initialize() {
    /* eslint-disable no-param-reassign */
    data.addresses = {};

    // filter out accounts that were not in the 'accounts' list in the agent config file
    (Object.keys(accountAddresses)).forEach((name) => {
      if (!config.usdcBalanceChange.accounts.includes(name)) {
        delete accountAddresses[name];
      }
    });

    // include only contracts that were in the 'contracts' list in the agent config file
    const contractAddresses = {};
    config.usdcBalanceChange.contracts.forEach((name) => {
      contractAddresses[name] = contracts[name].address;
    });

    // combine the account and contract addresses into a single list to monitor
    const allAddresses = { ...accountAddresses, ...contractAddresses };

    // initialize the object that will track balances for the addresses of interest
    // also convert the addresses to lowercase at this step
    (Object.entries(allAddresses)).forEach(([name, address]) => {
      data.addresses[address.toLowerCase()] = {
        name,
        balanceHistory: [],
      };
    });

    // set up an ethers provider
    data.provider = new ethers.providers.JsonRpcProvider(getJsonRpcUrl());

    // USDC contract addresses for testing:
    // Mainnet: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 (official)
    // Rinkeby: 0x40DFcFEB94575Aaf4a97EBE020850e13f84a46E5
    // Arbitrum Rinkeby: 0x84B12ABC7E4B6C82211BF2E1DCDb4D759C1623e3
    data.USDC_ADDRESS = config.usdcBalanceChange.USDC_ADDRESS;

    // create a Contract object for querying the USDC contract
    data.usdcContract = new ethers.Contract(data.USDC_ADDRESS, usdcAbi, data.provider);

    // assign configurable fields
    data.blockWindow = config.usdcBalanceChange.blockWindow;
    // since balance increase detection is not supported, for changeThresholdPercent handle the
    // possibility of positive and negative values
    // e.g. the user may enter 10 or -10, but the result will be the same
    data.changeThresholdPercent = Math.abs(config.usdcBalanceChange.changeThresholdPercent);
    /* eslint-enable no-param-reassign */
  };
}

module.exports = {
  provideInitialize,
  initialize: provideInitialize(initializeData),
  provideHandleBlock,
  handleBlock: provideHandleBlock(initializeData),
};
