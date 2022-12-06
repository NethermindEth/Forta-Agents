import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

const DECIMALS = 10 ** 18;

// Threshold amounts for individual network tokens
const thresholds = {
  MAINNET_ETH: 100,
  BNB: 40,
  MATIC: 150000,
  ARBITRUM_ETH: 100,
  FTM: 600000,
  AVAX: 10000,
  OPTIMISM_ETH: 100
};

const CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    threshold: `${thresholds.MAINNET_ETH * DECIMALS}`
  },

  [Network.BSC]: {
    threshold: `${thresholds.BNB * DECIMALS}`
  },

  [Network.POLYGON]: {
    threshold: `${thresholds.MATIC * DECIMALS}`
  },

  [Network.ARBITRUM]: {
    threshold: `${thresholds.ARBITRUM_ETH * DECIMALS}`
  },

  [Network.FANTOM]: {
    threshold: `${thresholds.FTM * DECIMALS}`
  },

  [Network.AVALANCHE]: {
    threshold: `${thresholds.AVAX * DECIMALS}`
  },

  [Network.OPTIMISM]: {
    threshold: `${thresholds.OPTIMISM_ETH * DECIMALS}`
  }
};

export default CONFIG;
