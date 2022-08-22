export interface NetworkData {
  lotteryAddress: string;
}

export const DATA: Record<number, NetworkData> = {
  56: {
    lotteryAddress: "0x5aF6D33DE2ccEC94efb1bDF8f92Bd58085432d2c", //BSC Mainnet contract address
  },
  97: {
    lotteryAddress: "0x1a79f536EB9E93570C30fd23Debf2a068Ea33d33", //BSC Testnet test contract address
  },
};
