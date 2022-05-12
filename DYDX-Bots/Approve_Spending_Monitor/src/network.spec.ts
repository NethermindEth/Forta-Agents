import { createAddress } from "forta-agent-tools/lib/tests";
import NetworkManager from "./network";
import NetworkData from "./network";

// Format:[network, liquidityModule, safetyModule, dydxAddress, usdcAddress][];
const TEST_CASES: [number, string, string, string, string][] = [
  [11, createAddress("0xb1a"), createAddress("0xb1b"), createAddress("0xb1c"), createAddress("0xb1d")],
  [22, createAddress("0xb2a"), createAddress("0xb2b"), createAddress("0xb2c"), createAddress("0xb2d")],
  [33, createAddress("0xb3a"), createAddress("0xb3b"), createAddress("0xb3c"), createAddress("0xb3d")],
];

const generateNetworkMap = (data: [number, string, string, string, string]): Record<number, NetworkData> => {
  // generates a NetworkMap for one test case.
  let networkMap: Record<number, NetworkData> = {};

  networkMap[data[0]] = {
    liquidityModule: data[1],
    safetyModule: data[2],
    dydxAddress: data[3],
    usdcAddress: data[4],
  } as NetworkData;

  return networkMap;
};

describe("NetworkManager test suite", () => {
  it("should return the correct contract address for each network", async () => {
    for (let testCase of TEST_CASES) {
      const networkMap: Record<number, NetworkData> = generateNetworkMap(testCase);
      const networkManager = new NetworkManager(networkMap);
      networkManager.setNetwork(testCase[0]);

      expect(networkManager.liquidityModule).toStrictEqual(testCase[1]);
    }
  });

  it("should throw error from using unsupported network", async () => {
    for (let testCase of TEST_CASES) {
      const networkMap: Record<number, NetworkData> = generateNetworkMap(testCase);
      const networkManager = new NetworkManager(networkMap);

      expect(() => {
        // 99 is an unsupported networkId
        networkManager.setNetwork(99);
      }).toThrow(new Error("You are running the bot in a non supported network"));
    }
  });
});
