export interface NetworkData {
  address: string;
  positionsNumber: number;
  blockNumber: number;
}

export const networkData: Record<number, NetworkData> = {
  42161: {
    address: "0x489ee077994B6658eAfA855C308275EAd8097C4A",
    positionsNumber: 50,
    blockNumber: 100,
  },
  43114: {
    address: "0x9ab2De34A33fB459b538c43f251eB825645e8595",
    positionsNumber: 50,
    blockNumber: 150,
  },
  42: {
    address: "0x9ab2De34A33fB459b538c43f251eB825645e8595",
    positionsNumber: 50,
    blockNumber: 150,
  },
};
