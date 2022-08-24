import { Network } from "forta-agent";
const HUBPOOL_ADDRESS = "0xc186fa914353c44b2e33ebe05f21846f1048beda";

export interface NetworkDataInterface {
  hubPoolAddr: string;
}

export const NM_DATA: Record<number, NetworkDataInterface> = {
  [Network.MAINNET]: { hubPoolAddr: HUBPOOL_ADDRESS },
  // [Network.GOERLI]: { hubPoolAddr: "0xBc079C669989C432aBd026956f31CF82C8400faa" }, //PoC
};
