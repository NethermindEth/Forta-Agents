import { Network } from "forta-agent";

export interface NetworkData {
  hubPoolAddress: string;
}

export const NetworkManagerData: Record<number, NetworkData> = {
  [Network.MAINNET]: {
    hubPoolAddress: "0xc186fA914353c44b2E33eBE05f21846F1048bEda",
  },
  [Network.GOERLI]: {
    hubPoolAddress: "0x62DF0cDE1eB67D2c3f2928A591f3ABc170FE42Ba", // MockHubpool on Goerli testnet
  },
};
