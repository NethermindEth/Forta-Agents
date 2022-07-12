export interface NetworkData {
  address: string;
  threshold: number;
  blockNumber: number;
}

export const networkData: Record<number, NetworkData> = {
  42161: {
    address: "0x489ee077994B6658eAfA855C308275EAd8097C4A",
    threshold: 50,
    blockNumber: 100,
  },
  43114: {
    address: "0x9ab2De34A33fB459b538c43f251eB825645e8595",
    threshold: 50,
    blockNumber: 150,
  },
  42: {
    address: "0x19D7085288bD7130Fe67A6EE58ECFBe7005C5E9f",
    threshold: 50,
    blockNumber: 150,
  },
};
