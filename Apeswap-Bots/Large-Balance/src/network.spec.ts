import { createAddress } from "forta-agent-tools/lib/tests";
import NetworkManager from "./network";
import NetworkData from "./network";


const TEST_TOKENS: [string, string, string, string][] = [
  [createAddress("0xbe"), createAddress("0xbf"), createAddress("0xba"), createAddress("0xbb")],
  [createAddress("0xce"), createAddress("0xcf"), createAddress("0xca"), createAddress("0xcb")],
  [createAddress("0xde"), createAddress("0xdf"), createAddress("0xda"), createAddress("0xdb")],
  [createAddress("0xee"), createAddress("0xef"), createAddress("0xea"), createAddress("0xeb")],
];
const TEST_NETWORKS = [1, 22, 33, 45];

const generateNetworkMap = (
  networks: number[],  
  tokensData: string[]
): Record<number, NetworkData> => {
  // generates a NetworkMap for one test case.
  // networks and data should be same length.
  let networkMap: Record<number, NetworkData> = {};
  for (let i = 0; i < networks.length; i++) {
    networkMap[networks[i]] = {      
      gnana: tokensData[i],
    } as NetworkData;
  }
  return networkMap;
};

describe("NetworkManager test suite", () => {
  it("should return the correct addresses for each network", async () => {
    for (let k = 0; k < TEST_TOKENS.length; k++) {
      const networkMap: Record<number, NetworkData> = generateNetworkMap(
        TEST_NETWORKS,        
        TEST_TOKENS[k]
      );
      const networkMan = new NetworkManager(networkMap);
      for (let i = 0; i < TEST_NETWORKS.length; i++) {
        networkMan.setNetwork(TEST_NETWORKS[i]);       
        expect(networkMan.gnana).toStrictEqual(TEST_TOKENS[k][i]);
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