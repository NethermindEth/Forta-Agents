import { createAddress } from "forta-agent-tools/lib/tests";
import NetworkManager from "./network";
import NetworkData from "./network";

// Format:[network, multicall2Data, factory, pairInitCodeHash][];
const TEST_CASES: [number, Record<number, string>, string, string][] = [
  [
    11,
    { 11: createAddress("0xa2a") },
    createAddress("0xb1a"),
    "0x0bbca9af0511ad1a1da383135cf3a8d2ac620e549ef9f6ae3a4c33c2fed0af91",
  ],
  [
    22,
    { 22: createAddress("0xa3b") },
    createAddress("0xb2a"),
    "0xea2e4d8ff7b84771dace7688751971197f2a4578c0298c78d11d93165de73773",
  ],
  [
    33,
    { 33: createAddress("0xa4c") },
    createAddress("0xb3a"),
    "0x0bbca9af0511ad1a1da383135cf3a8d2af2a4578c0298c78d11d93165de73773",
  ],
];

const generateNetworkMap = (data: [number, Record<number, string>, string, string]): Record<number, NetworkData> => {
  // generates a NetworkMap for one test case.
  let networkMap: Record<number, NetworkData> = {};

  networkMap[data[0]] = {
    chainId: data[0],
    multicall2Data: data[1],
    factory: data[2],
    pairInitCodeHash: data[3],
  } as NetworkData;

  return networkMap;
};

describe("NetworkManager test suite", () => {
  it("should return the correct contract address for each network", async () => {
    for (let testCase of TEST_CASES) {
      const networkMap: Record<number, NetworkData> = generateNetworkMap(testCase);

      const [network, multicall2Data, factory, pairInitCodeHash] = testCase;
      const networkManager = new NetworkManager(networkMap);
      networkManager.setNetwork(network);

      expect(networkManager.chainId).toStrictEqual(network);
      expect(networkManager.multicall2Data).toStrictEqual(multicall2Data);
      expect(networkManager.factory).toStrictEqual(factory);
      expect(networkManager.pairInitCodeHash).toStrictEqual(pairInitCodeHash);
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
