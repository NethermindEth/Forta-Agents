import { Network } from "forta-agent";

export interface NetworkData {
  spokePoolAddress: string;
}

export const DATA: Record<number, NetworkData> = {
  [Network.MAINNET]: {
    spokePoolAddress: "0x4D9079Bb4165aeb4084c526a32695dCfd2F77381", //Ethereum Mainnet contract address
  },

  [Network.ARBITRUM]: {
    spokePoolAddress: "0xB88690461dDbaB6f04Dfad7df66B7725942FEb9C", //Arbitrum contract address
  },

  [Network.POLYGON]: {
    spokePoolAddress: "0xD3ddAcAe5aFb00F9B9cD36EF0Ed7115d7f0b584c", //Polygon contract address
  },

  [Network.OPTIMISM]: {
    spokePoolAddress: "0xa420b2d1c0841415A695b81E5B867BCD07Dff8C9", //Optimism contract address
  },

  [Network.GOERLI]: {
    spokePoolAddress: "0xA8FEd6B0CaDc7bcAbD76f9A7399B0A5Ca0C93A22", //Goerli Testnet test contract address
  },
};
