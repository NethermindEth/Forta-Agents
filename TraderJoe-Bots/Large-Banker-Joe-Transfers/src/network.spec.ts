import { createAddress } from "forta-agent-tools/lib/tests";
import NetworkManager from "./network";
import NetworkData from "./network";

/*
Format:[
    [joeTroller network1 , joeTroller network2, joeTroller network3],  
];
*/

const TEST_CASES: [string, string, string][] = [
  [createAddress("0xb1a"), createAddress("0xb2a"), createAddress("0xb3a")],
  [createAddress("0xc1a"), createAddress("0xc2a"), createAddress("0xc3a")],
  [createAddress("0xd1a"), createAddress("0xd2a"), createAddress("0xd3a")],
  [createAddress("0xe1a"), createAddress("0xe2a"), createAddress("0xe3a")],
];
const TEST_NETWORKS = [11, 22, 33];

const generateNetworkMap = (
  networks: number[],
  testData: string[]
): Record<number, NetworkData> => {
  // generates a NetworkMap for one test case.

  let networkMap: Record<number, NetworkData> = {};
  for (let i = 0; i < testData.length; i++) {
    networkMap[networks[i]] = {
      joeTroller: testData[i],
    } as NetworkData;
  }
  return networkMap;
};

describe("NetworkManager test suite", () => {
  it("should return the correct addresses for each network", async () => {
    for (let i = 0; i < TEST_CASES.length; i++) {
      const networkMap: Record<number, NetworkData> = generateNetworkMap(
        TEST_NETWORKS,
        TEST_CASES[i]
      );
      const networkMan = new NetworkManager(networkMap);
      for (let j = 0; j < TEST_NETWORKS.length; j++) {
        networkMan.setNetwork(TEST_NETWORKS[j]);
        expect(networkMan.joeTroller).toStrictEqual(TEST_CASES[i][j]);
      }

      // test with a non supported network
      let errorMessage = "";
      try {
        networkMan.setNetwork(99);
      } catch (error) {
        errorMessage = String(error);
      }
      expect(errorMessage).toStrictEqual(
        `Error: You are running the bot in a non supported network`
      );
    }
  });
});
