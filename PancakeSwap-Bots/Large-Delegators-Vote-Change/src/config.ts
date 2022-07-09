export interface NetworkData {
  cakeAddress: string;
}

export const DATA: Record<number, NetworkData> = {
  56: {
    cakeAddress: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", //BSC Mainnet contract address
  },
  97: {
    cakeAddress: "0xF773FC72DD607535D599D83Ce3Be6dFAE4fc3F32", //BSC Testnet test contract address
  },
};
