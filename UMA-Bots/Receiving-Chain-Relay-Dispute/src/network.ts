import { HUBPOOL_ADDRESS } from "./constants";

export interface NetworkDataInterface {
  hubPoolAddr: string;
}

export const NM_DATA: Record<number, NetworkDataInterface> = {
  1: { hubPoolAddr: HUBPOOL_ADDRESS },
  5: { hubPoolAddr: "0xBc079C669989C432aBd026956f31CF82C8400faa" }, //PoC
};
