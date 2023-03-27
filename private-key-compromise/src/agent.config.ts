import { Network } from "forta-agent";
import { AgentConfig } from "./utils";

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

export default CONFIG;
