import { Network } from "forta-agent";
import { GOERLI_POC_HUBPOOL_ADDRESS, HUBPOOL_ADDRESS } from "./constants";

export interface NetworkDataInterface {
  hubPoolAddr: string;
}

export const NM_DATA: Record<number, NetworkDataInterface> = {
  [Network.MAINNET]: { hubPoolAddr: HUBPOOL_ADDRESS },
  [Network.GOERLI]: { hubPoolAddr: GOERLI_POC_HUBPOOL_ADDRESS }, //PoC
};
