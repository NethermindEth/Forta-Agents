import { Network } from "forta-agent";
import {
  MAINNET_MONITORED_TOKENS,
  ARBITRUM_MONITORED_TOKENS,
  POLYGON_MONITORED_TOKENS,
  OPTIMISM_MONITORED_TOKENS,
  ARBITRUM_MONITORED_ADDRESSES,
  POLYGON_MONITORED_ADDRESSES,
  OPTIMISM_MONITORED_ADDRESSES,
  MAINNET_MONITORED_ADDRESSES,
  MAINET_PERCENTAGE_CHANGE_THRESHOLD,
  ARBITRUM_PERCENTAGE_CHANGE_THRESHOLD,
  POLYGON_PERCENTAGE_CHANGE_THRESHOLD,
  OPTIMISM_PERCENTAGE_CHANGE_THRESHOLD,
} from "./configurables";

import { GOERLI_MONITORED_ADDRESSES, GOERLI_MONITORED_TOKENS, GOERLI_PERCENTAGE_CHANGE_THRESHOLD } from "./utils";

export interface NetworkDataInterface {
  monitoredTokens: string[];
  monitoredAddresses: string[];
  alertThreshold: number;
}

export const NM_DATA: Record<number, NetworkDataInterface> = {
  [Network.MAINNET]: {
    monitoredTokens: MAINNET_MONITORED_TOKENS,
    monitoredAddresses: MAINNET_MONITORED_ADDRESSES,
    alertThreshold: MAINET_PERCENTAGE_CHANGE_THRESHOLD,
  },
  [Network.ARBITRUM]: {
    monitoredTokens: ARBITRUM_MONITORED_TOKENS,
    monitoredAddresses: ARBITRUM_MONITORED_ADDRESSES,
    alertThreshold: ARBITRUM_PERCENTAGE_CHANGE_THRESHOLD,
  },
  [Network.POLYGON]: {
    monitoredTokens: POLYGON_MONITORED_TOKENS,
    monitoredAddresses: POLYGON_MONITORED_ADDRESSES,
    alertThreshold: POLYGON_PERCENTAGE_CHANGE_THRESHOLD,
  },
  [Network.OPTIMISM]: {
    monitoredTokens: OPTIMISM_MONITORED_TOKENS,
    monitoredAddresses: OPTIMISM_MONITORED_ADDRESSES,
    alertThreshold: OPTIMISM_PERCENTAGE_CHANGE_THRESHOLD,
  },
  [Network.GOERLI]: {
    monitoredTokens: GOERLI_MONITORED_TOKENS,
    monitoredAddresses: GOERLI_MONITORED_ADDRESSES,
    alertThreshold: GOERLI_PERCENTAGE_CHANGE_THRESHOLD,
  },
};
