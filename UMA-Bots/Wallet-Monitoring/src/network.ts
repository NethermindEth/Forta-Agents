import { Network } from "forta-agent";
import {
  GOERLI_POC_HUBPOOL_ADDRESS,
  GOERLI_POC_MONITORED_ADDRESSES,
  HUBPOOL_ADDRESS,
  MONITORED_ADDRESSES,
} from "./utils";

export interface NetworkDataInterface {
  hubPoolAddr: string;
  monitoredList: string[];
}

export const NM_DATA: Record<number, NetworkDataInterface> = {
  [Network.MAINNET]: {
    hubPoolAddr: HUBPOOL_ADDRESS,
    monitoredList: MONITORED_ADDRESSES,
  },
  [Network.GOERLI]: {
    hubPoolAddr: GOERLI_POC_HUBPOOL_ADDRESS,
    monitoredList: GOERLI_POC_MONITORED_ADDRESSES,
  }, //PoC
};
