import { createAddress } from "forta-agent-tools/lib/tests";
import NetworkManager from "./network";
import NetworkData from "./network";

/*
Format:[
    [network, [liquidityModule, usdcAddress]],
    [network, [liquidityModule, usdcAddress]],
    [network, [liquidityModule, usdcAddress]]
];
*/
const TEST_CASES: [[number, [string, string]], [number, [string, string]], [number, [string, string]]] = [
  [11, [createAddress("0xb1a"), createAddress("0xb1b")]],
  [22, [createAddress("0xb2a"), createAddress("0xb2b")]],
  [33, [createAddress("0xb3a"), createAddress("0xb3b")]],
];

const generateNetworkMap = (network: number, addresses: string[]): Record<number, NetworkData> => {
  // generates a NetworkMap for one test case.
  let networkMap: Record<number, NetworkData> = {};
  networkMap[network] = {
    liquidityModule: addresses[0],
    usdcAddress: addresses[1],
  } as NetworkData;
  return networkMap;
};

describe("NetworkManager test suite", () => {
  it("should return the correct contract address for each network", async () => {
    for (let testCase of TEST_CASES) {
      const networkMap: Record<number, NetworkData> = generateNetworkMap(testCase[0], testCase[1]);
      const networkManager = new NetworkManager(networkMap);
      networkManager.setNetwork(testCase[0]);
      
      expect(networkManager.liquidityModule).toStrictEqual(testCase[1][0]);
      expect(networkManager.usdcAddress).toStrictEqual(testCase[1][1]);
    }
  });
});