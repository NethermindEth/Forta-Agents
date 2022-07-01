import { createAddress } from "forta-agent-tools/lib/tests";
import NetworkManager from "./network";
import NetworkData from "./network";

const TEST_DATA: [string, { systemSlot: string | number; mappingSlot: string | number }][] = [
  [createAddress("0xb1"), { systemSlot: 5, mappingSlot: 10 }], // [perpetualProxy, slots]
  [createAddress("0xc1"), { systemSlot: 9, mappingSlot: 19 }],
  [createAddress("0xd1"), { systemSlot: 12, mappingSlot: 22 }],
  [createAddress("0xe1"), { systemSlot: 24, mappingSlot: 40 }],
];

const TEST_NETWORKS = [1, 22, 33, 45];

const generateNetworkMap = (networks: number[], data: any[][]): Record<number, NetworkData> => {
  // generates a NetworkMap for one test case.
  // networks and data should be same length.
  let networkMap: Record<number, NetworkData> = {};
  for (let i = 0; i < networks.length; i++) {
    networkMap[networks[i]] = {
      perpetualProxy: data[i][0],
      slots: data[i][1],
    } as NetworkData;
  }
  return networkMap;
};

describe("NetworkManager test suite", () => {
  it("should return the correct address for each network", async () => {
    const networkMap: Record<number, NetworkData> = generateNetworkMap(TEST_NETWORKS, TEST_DATA);
    const networkMan = new NetworkManager(networkMap);

    for (let i = 0; i < TEST_NETWORKS.length; i++) {
      networkMan.setNetwork(TEST_NETWORKS[i]);
      expect(networkMan.perpetualProxy).toStrictEqual(TEST_DATA[i][0]);
      expect(networkMan.slots).toStrictEqual(TEST_DATA[i][1]);
    }
    // test with a non supported network
    let errorMessage = "";
    try {
      networkMan.setNetwork(99);
    } catch (error) {
      errorMessage = String(error);
    }
    expect(errorMessage).toStrictEqual(`Error: You are running the bot in a non supported network`);
  });
});
