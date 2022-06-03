import { createAddress } from "forta-agent-tools/lib/tests";
import NetworkManager from "./network";
import NetworkData from "./network";

// Format:[network, multicall, factory][];
const TEST_CASES: [number, string, string][] = [
  [11, createAddress("0xa2a"), createAddress("0xb1a")],
  [22, createAddress("0xa3b"), createAddress("0xb2a")],
  [33, createAddress("0xa4c"), createAddress("0xb3a")],
];

const generateNetworkMap = (data: [number, string, string]): Record<number, NetworkData> => {
  // generates a NetworkMap for one test case.
  let networkMap: Record<number, NetworkData> = {};

  networkMap[data[0]] = {
    multicall: data[1],
    factory: data[2],
  } as NetworkData;

  return networkMap;
};

describe("NetworkManager test suite", () => {
  it("should return the correct contract address for each network", async () => {
    for (let testCase of TEST_CASES) {
      const networkMap: Record<number, NetworkData> = generateNetworkMap(testCase);
      const networkManager = new NetworkManager(networkMap);
      networkManager.setNetwork(testCase[0]);

      expect(networkManager.multicall).toStrictEqual(testCase[1]);
      expect(networkManager.factory).toStrictEqual(testCase[2]);
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
