export interface NetworkDataInterface {
  hubPoolAddr: string;
}

export const NM_DATA: Record<number, NetworkDataInterface> = {
  1: { hubPoolAddr: "0xc186fa914353c44b2e33ebe05f21846f1048beda", },
  5: { hubPoolAddr: "0x9F1CBa21257DA30A31d42EA53999CFcA179E849e" }, //PoC
};
