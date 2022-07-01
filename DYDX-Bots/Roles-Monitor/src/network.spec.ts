import { createAddress } from "forta-agent-tools/lib/tests";
import NetworkManager from "./network";
import NetworkData from "./network";

// Format:[networkId, [safetyModule, liquidityModule]][];
const TEST_CASES: [number, [string, string]][] = [
  [11, [createAddress("0xb1a"), createAddress("0xb1b")]],
  [22, [createAddress("0xb2a"), createAddress("0xb2b")]],
  [33, [createAddress("0xb3a"), createAddress("0xb3b")]],
];

const generateNetworkMap = (network: number, addresses: string[]): Record<number, NetworkData> => {
  // generates a NetworkMap for one test case.
  let networkMap: Record<number, NetworkData> = {};
  networkMap[network] = {
    safetyModule: addresses[0],
    liquidityModule: addresses[1],
  } as NetworkData;
  return networkMap;
};

describe("NetworkManager test suite", () => {
  it("should return the correct contract address for each network", async () => {
    for (let testCase of TEST_CASES) {
      const networkMap: Record<number, NetworkData> = generateNetworkMap(testCase[0], testCase[1]);
      const networkManager = new NetworkManager(networkMap);
      networkManager.setNetwork(testCase[0]);

      expect(networkManager.safetyModule).toStrictEqual(testCase[1][0]);
      expect(networkManager.liquidityModule).toStrictEqual(testCase[1][1]);
    }
  });

  it("should throw error from using unsupported network", async () => {
    for (let testCase of TEST_CASES) {
      const networkMap: Record<number, NetworkData> = generateNetworkMap(testCase[0], testCase[1]);
      const networkManager = new NetworkManager(networkMap);

      expect(() => {
        // 99 is an unsupported networkId
        networkManager.setNetwork(99);
      }).toThrow(new Error("You are running the bot in a non supported network"));
    }
  });
});
