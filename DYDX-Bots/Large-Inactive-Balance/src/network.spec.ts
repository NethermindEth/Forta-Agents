import { createAddress } from "forta-agent-tools/lib/tests";
import NetworkManager from "./network";
import NetworkData from "./network";

const TEST_MODULES: [string, string, string, string][] = [
  [createAddress("0xb1"), createAddress("0xb2"), createAddress("0xb3"), createAddress("0xb4")],
  [createAddress("0xc1"), createAddress("0xc2"), createAddress("0xc3"), createAddress("0xc4")],
  [createAddress("0xd1"), createAddress("0xd2"), createAddress("0xd3"), createAddress("0xd4")],
  [createAddress("0xe1"), createAddress("0xe2"), createAddress("0xe3"), createAddress("0xe4")],
];

const TEST_TOKENS: [string, string, string, string][] = [
  [createAddress("0xbe"), createAddress("0xbf"), createAddress("0xba"), createAddress("0xbb")],
  [createAddress("0xce"), createAddress("0xcf"), createAddress("0xca"), createAddress("0xcb")],
  [createAddress("0xde"), createAddress("0xdf"), createAddress("0xda"), createAddress("0xdb")],
  [createAddress("0xee"), createAddress("0xef"), createAddress("0xea"), createAddress("0xeb")],
];
const TEST_NETWORKS = [1, 22, 33, 45];

const generateNetworkMap = (
  networks: number[],
  modulesData: string[],
  tokensData: string[]
): Record<number, NetworkData> => {
  // generates a NetworkMap for one test case.
  // networks and data should be same length.
  let networkMap: Record<number, NetworkData> = {};
  for (let i = 0; i < networks.length; i++) {
    networkMap[networks[i]] = {
      safetyModule: modulesData[i],
      dydxAddress: tokensData[i],
    } as NetworkData;
  }
  return networkMap;
};

describe("NetworkManager test suite", () => {
  it("should return the correct addresses for each network", async () => {
    for (let k = 0; k < TEST_MODULES.length; k++) {
      const networkMap: Record<number, NetworkData> = generateNetworkMap(
        TEST_NETWORKS,
        TEST_MODULES[k],
        TEST_TOKENS[k]
      );
      const networkMan = new NetworkManager(networkMap);
      for (let i = 0; i < TEST_NETWORKS.length; i++) {
        networkMan.setNetwork(TEST_NETWORKS[i]);
        expect(networkMan.safetyModule).toStrictEqual(TEST_MODULES[k][i]);
        expect(networkMan.dydxAddress).toStrictEqual(TEST_TOKENS[k][i]);
      }
      // test with a non supported network
      let errorMessage = "";
      try {
        networkMan.setNetwork(99);
      } catch (error) {
        errorMessage = String(error);
      }
      expect(errorMessage).toStrictEqual(`Error: You are running the bot in a non supported network`);
    }
  });
});
