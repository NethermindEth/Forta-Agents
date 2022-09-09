import { Network } from "forta-agent";
import {
  ARB_SPOKEPOOL_MONITORED_EVENTS,
  HUBPOOL_MONITORED_EVENTS,
  OP_SPOKEPOOL_MONITORED_EVENTS,
  POLYGON_SPOKEPOOL_MONITORED_EVENTS,
  SPOKEPOOL_MONITORED_EVENTS,
} from "./utils";

const POC_HUBPOOL_ADDRESS = "0x68715254125884dE73391b6bBaf0776Cf634c24D";
const POC_SPOKEPOOL_ADDRESS = "0x4972B5D2B9ac17784428701de1113d5A42970521";
const MAINNET_HUBPOOL = "0xc186fa914353c44b2e33ebe05f21846f1048beda";
const MAINNET_SPOKEPOOL = "0x4D9079Bb4165aeb4084c526a32695dCfd2F77381";
const OPTIMISM_SPOKEPOOL = "0xa420b2d1c0841415A695b81E5B867BCD07Dff8C9";
const POLYGON_SPOKEPOOL = "0x69B5c72837769eF1e7C164Abc6515DcFf217F920";
const ARBITRUM_SPOKEPOOL = "0xB88690461dDbaB6f04Dfad7df66B7725942FEb9C";

// @dev Both 'hubPoolAddr' and 'monitoredHubPoolEvents' must be passed whenever a HubPool is to be monitored on a chain
export interface NetworkDataInterface {
  spokePoolAddr: string;
  monitoredSpokePoolEvents: string[];
  hubPoolAddr?: string;
  monitoredHubPoolEvents?: string[];
}

export const NM_DATA: Record<number, NetworkDataInterface> = {
  [Network.MAINNET]: {
    spokePoolAddr: MAINNET_SPOKEPOOL,
    monitoredSpokePoolEvents: SPOKEPOOL_MONITORED_EVENTS,
    hubPoolAddr: MAINNET_HUBPOOL,
    monitoredHubPoolEvents: HUBPOOL_MONITORED_EVENTS
  },
  [Network.OPTIMISM]: { spokePoolAddr: OPTIMISM_SPOKEPOOL, monitoredSpokePoolEvents: OP_SPOKEPOOL_MONITORED_EVENTS },
  [Network.ARBITRUM]: { spokePoolAddr: ARBITRUM_SPOKEPOOL, monitoredSpokePoolEvents: ARB_SPOKEPOOL_MONITORED_EVENTS },
  [Network.POLYGON]: { spokePoolAddr: POLYGON_SPOKEPOOL, monitoredSpokePoolEvents: POLYGON_SPOKEPOOL_MONITORED_EVENTS },
  [Network.GOERLI]: {
    spokePoolAddr: POC_SPOKEPOOL_ADDRESS,
    hubPoolAddr: POC_HUBPOOL_ADDRESS,
    monitoredSpokePoolEvents: SPOKEPOOL_MONITORED_EVENTS,
    monitoredHubPoolEvents: HUBPOOL_MONITORED_EVENTS
  }, //PoC
};