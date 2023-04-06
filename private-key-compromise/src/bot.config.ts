import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

export const EOA_TRANSACTION_COUNT_THRESHOLD = 100;
export const CONTRACT_TRANSACTION_COUNT_THRESHOLD = 500;

export const timePeriodDays = 1;

// threshold amounts for individual network tokens to be left in an account in order to be considered as drained
const thresholds = {
  MAINNET_ETH: "0.05",
  BNB: "0.05",
  MATIC: "5",
  ARBITRUM_ETH: "0.05",
  FTM: "20",
  AVAX: "0.3",
  OPTIMISM_ETH: "0.05",
};

const CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    threshold: thresholds.MAINNET_ETH,
  },

  [Network.BSC]: {
    threshold: thresholds.BNB,
  },

  [Network.POLYGON]: {
    threshold: thresholds.MATIC,
  },

  [Network.ARBITRUM]: {
    threshold: thresholds.ARBITRUM_ETH,
  },

  [Network.FANTOM]: {
    threshold: thresholds.FTM,
  },

  [Network.AVALANCHE]: {
    threshold: thresholds.AVAX,
  },

  [Network.OPTIMISM]: {
    threshold: thresholds.OPTIMISM_ETH,
  },
};

interface etherscanApisInterface {
  [key: number]: {
    urlAccount: string;
  };
}

export const etherscanApis: etherscanApisInterface = {
  1: {
    urlAccount: "https://api.etherscan.io/api?module=account&action=txlist",
  },
  10: {
    urlAccount: "https://api-optimistic.etherscan.io/api?module=account&action=txlist",
  },
  56: {
    urlAccount: "https://api.bscscan.com/api?module=account&action=txlist",
  },
  137: {
    urlAccount: "https://api.polygonscan.com/api?module=account&action=txlist",
  },
  250: {
    urlAccount: "https://api.ftmscan.com/api?module=account&action=txlist",
  },
  42161: {
    urlAccount: "https://api.arbiscan.io/api?module=account&action=txlist",
  },
  43114: {
    urlAccount: "https://api.snowtrace.io/api?module=account&action=txlist",
  },
};

export default CONFIG;
