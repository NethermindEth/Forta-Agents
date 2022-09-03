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
} from "./configAddresses";

import { GOERLI_MONITORED_ADDRESSES, GOERLI_MONITORED_TOKENS } from "./utils";

export interface NetworkDataInterface {
  monitoredTokens: string[];
  monitoredAddresses: string[];
}

export const NM_DATA: Record<number, NetworkDataInterface> = {
  [Network.MAINNET]: {
    monitoredTokens: MAINNET_MONITORED_TOKENS,
    monitoredAddresses: MAINNET_MONITORED_ADDRESSES,
  },
  [Network.ARBITRUM]: {
    monitoredTokens: ARBITRUM_MONITORED_TOKENS,
    monitoredAddresses: ARBITRUM_MONITORED_ADDRESSES,
  },
  [Network.POLYGON]: {
    monitoredTokens: POLYGON_MONITORED_TOKENS,
    monitoredAddresses: POLYGON_MONITORED_ADDRESSES,
  },
  [Network.OPTIMISM]: {
    monitoredTokens: OPTIMISM_MONITORED_TOKENS,
    monitoredAddresses: OPTIMISM_MONITORED_ADDRESSES,
  },
  [Network.GOERLI]: {
    monitoredTokens: GOERLI_MONITORED_TOKENS,
    monitoredAddresses: GOERLI_MONITORED_ADDRESSES,
  },
};
