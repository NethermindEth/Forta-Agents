export interface NetworkData {
  cakeVaultAddress: string;
}

export const DATA: Record<number, NetworkData> = {
  56: {
    cakeVaultAddress: "0xa80240Eb5d7E05d3F250cF000eEc0891d00b51CC", //BSC Mainnet contract address
  },
  97: {
    cakeVaultAddress: "", //BSC Testnet test contract address
  },
};
