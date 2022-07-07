export interface NetworkData {
  cakeAddress: string;
}

export const DATA: Record<number, NetworkData> = {
  56: {
    cakeAddress: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", //BSC Mainnet contract address
  },
  97: {
    cakeAddress: "0x114403f38a4f01b45275a726c6346E1669C19E7D", //BSC Testnet test contract address
  },
};
