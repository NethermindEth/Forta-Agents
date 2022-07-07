export interface NetworkData {
  cakeAddress: string;
}

export const DATA: Record<number, NetworkData> = {
  56: {
    cakeAddress: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", //BSC Mainnet contract address
  },
  97: {
    cakeAddress: "0x4B8432e8eEF48d4A4A978c4679d63B544fcA7b99", //BSC Testnet test contract address
  },
};
