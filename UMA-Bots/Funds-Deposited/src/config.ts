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
    spokePoolAddress: "0xBC760257763b77aeEa256c129e09DB41bD2c1450", //Goerli Testnet test contract address
  },
};
