export interface NetworkData {
  cakeAddress: string;
}

export const DATA: Record<number, NetworkData> = {
  56: {
    cakeAddress: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", //BSC Mainnet contract address
  },
  97: {
    cakeAddress: "0x0151A9301b52CCAfA75cd501Bff874C8901260b0", //BSC Testnet test contract address
  },
};
