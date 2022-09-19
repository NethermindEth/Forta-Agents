import { Network } from "forta-agent";
import {
  MAINNET_TOKEN_THRESHOLDS,
  ARBITRUM_TOKEN_THRESHOLDS,
  OPTIMISM_TOKEN_THRESHOLDS,
  POLYGON_TOKEN_THRESHOLDS,
  GOERLI_TOKEN_THRESHOLDS,
} from "./chainThresholds";

import {
  ARBITRUM_SPOKEPOOL,
  GOERLI_POC_SPOKEPOOL_ADDRESS,
  MAINNET_SPOKEPOOL,
  OPTIMISM_SPOKEPOOL,
  POLYGON_SPOKEPOOL,
} from "./utils";

export interface NetworkDataInterface {
  tokenThresholds: Record<string, string>;
  spokePoolAddr: string;
}

export const NM_DATA: Record<number, NetworkDataInterface> = {
  [Network.MAINNET]: {
    tokenThresholds: MAINNET_TOKEN_THRESHOLDS,
    spokePoolAddr: MAINNET_SPOKEPOOL,
  },
  [Network.ARBITRUM]: {
    tokenThresholds: ARBITRUM_TOKEN_THRESHOLDS,
    spokePoolAddr: ARBITRUM_SPOKEPOOL,
  },
  [Network.POLYGON]: {
    tokenThresholds: POLYGON_TOKEN_THRESHOLDS,
    spokePoolAddr: POLYGON_SPOKEPOOL,
  },
  [Network.OPTIMISM]: {
    tokenThresholds: OPTIMISM_TOKEN_THRESHOLDS,
    spokePoolAddr: OPTIMISM_SPOKEPOOL,
  },
  [Network.GOERLI]: {
    tokenThresholds: GOERLI_TOKEN_THRESHOLDS,
    spokePoolAddr: GOERLI_POC_SPOKEPOOL_ADDRESS,
  },
};
