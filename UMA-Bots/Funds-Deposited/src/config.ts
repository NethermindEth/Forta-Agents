export interface NetworkData {
  spokePoolAddress: string;
}

export const DATA: Record<number, NetworkData> = {
  1: {
    spokePoolAddress: "0x4D9079Bb4165aeb4084c526a32695dCfd2F77381", //Ethereum Mainnet contract address
  },

  42161: {
    spokePoolAddress: "0xB88690461dDbaB6f04Dfad7df66B7725942FEb9C", //Arbitrum contract address
  },

  137: {
    spokePoolAddress: "0xD3ddAcAe5aFb00F9B9cD36EF0Ed7115d7f0b584c", //Polygon contract address
  },

  10: {
    spokePoolAddress: "0xa420b2d1c0841415A695b81E5B867BCD07Dff8C9", //Optimism contract address
  },

  5: {
    spokePoolAddress: "0xBC760257763b77aeEa256c129e09DB41bD2c1450", //Goerli Testnet test contract address
  },
};

export const MOCK_NETWORK_ID = 1111;
