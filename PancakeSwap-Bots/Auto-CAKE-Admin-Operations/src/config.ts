export interface NetworkData {
  cakeVaultAddress: string;
}

export const DATA: Record<number, NetworkData> = {
  56: {
    cakeVaultAddress: "0xa80240Eb5d7E05d3F250cF000eEc0891d00b51CC", //BSC Mainnet contract address
  },
  97: {
    cakeVaultAddress: "0x5af4cDEDe5650513d666fe1a9F57d78F84aEBEe9", //BSC Testnet test contract address
  },
};
