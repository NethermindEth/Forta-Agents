export interface NetworkData {
  spokePoolAddress: string;
}

export const DATA: Record<number, NetworkData> = {
  1: {
    spokePoolAddress: "0x4D9079Bb4165aeb4084c526a32695dCfd2F77381", //Ethereum Mainnet contract address
  },

  5: {
    spokePoolAddress: "0xBC760257763b77aeEa256c129e09DB41bD2c1450", //Goerli Testnet test contract address
  },
};

export const MOCK_NETWORK_ID = 1111;
