export interface NetworkDataInterface {
  hubPoolAddr: string;
}

export const NM_DATA: Record<number, NetworkDataInterface> = {
  1: { hubPoolAddr: "0xc186fa914353c44b2e33ebe05f21846f1048beda" },
  5: { hubPoolAddr: "0xBc079C669989C432aBd026956f31CF82C8400faa" }, //PoC
};
