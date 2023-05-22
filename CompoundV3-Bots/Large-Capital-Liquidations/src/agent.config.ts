import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

export const DEBUG = false;
export const DEBUG_CURRENT_BLOCK = 15419040;
export const DEBUG_CONFIG = {
  [Network.MAINNET]: {
    alertInterval: 60 * 60,
    multicallSize: 100,
    logFetchingBlockRange: 2000,
    logFetchingInterval: 2000,
    cometContracts: [
      {
        address: "0xc3d688B66703497DAA19211EEdff47f25384cdc3",
        deploymentBlock: 15331586,
        baseLargeThreshold: "1",
        monitoringListLength: 1000,
      },
    ],
  },
};

const CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    // Minimum interval between two uncollateralized borrow alerts for the
    // same borrower.
    alertInterval: 60 * 60, // seconds
    // Maximum calls in one multicall, used to check the borrow
    // collateralization status and user principals.
    // To change this the usual eth_call gas limits must be noticed.
    multicallSize: 100,
    // Block range used for each log fetching call during initialization.
    // Again, to change this the usual eth_getLogs block range limits must
    // be considered.
    logFetchingBlockRange: 2000,
    // Interval between log fetching calls for the initialization step.
    // It must be a reasonable amount to avoid any problems with the bot
    // runner provider, especially considering each log fetch leads to
    // additional calls.
    logFetchingInterval: 2000, // ms
    // Comet contracts to be monitored and some extra data
    cometContracts: [
      {
        // Address of the Comet contract.
        address: "0xc3d688B66703497DAA19211EEdff47f25384cdc3",
        // Deployment block of the contract (used for historical borrow fetching).
        deploymentBlock: 15331586,
        // Lower threshold that defines whether a position is 'large',
        // denominated in the same scale as in the contract.
        baseLargeThreshold: "1000000000000000000",
        // Length of the largest borrow positions that is constantly checked
        // for size & uncollateralized borrows. Works as an upper limit of
        // positions.
        // Ideally this limit must include all borrows currently greater or
        // equal than the threshold, otherwise positions that should be
        // monitored will likely be lost. If, when changing the list, the
        // smallest position is greater or equal than the threshold, a warning
        // log will be emitted.
        // It must also be considered that this should be a viable amount
        // considering memory limits and the network block rate.
        monitoringListLength: 1000,
      },
      {
        address: "0xA17581A9E3356d9A858b789D68B4d866e593aE94",
        deploymentBlock: 16400710,
        baseLargeThreshold: "1000000000000000000",
        monitoringListLength: 1000,
      },
    ],
  },

  [Network.POLYGON]: {
    alertInterval: 60 * 60,
    multicallSize: 100,
    logFetchingBlockRange: 2000,
    logFetchingInterval: 2000,
    cometContracts: [
      {
        address: "0xF25212E676D1F7F89Cd72fFEe66158f541246445",
        deploymentBlock: 39412367,
        baseLargeThreshold: "1000000000000000000",
        monitoringListLength: 100,
      },
    ],
  },
};

export default CONFIG;
