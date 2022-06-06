import { createAddress } from "forta-agent-tools/lib/tests";
import NetworkManager from "./network";
import NetworkData from "./network";

// Format:[networkId, [monitored contracts]][];
const TEST_CASES: [number, [string, string]][] = [
  [11, [createAddress("0xb1a"), createAddress("0xb1b")]],
  [22, [createAddress("0xb2a"), createAddress("0xb2b")]],
  [33, [createAddress("0xb3a"), createAddress("0xb3b")]],
];

const generateNetworkMap = (network: number, addresses: string[]): Record<number, NetworkData> => {
  // generates a NetworkMap for one test case.
  let networkMap: Record<number, NetworkData> = {};
  networkMap[network] = {
    monitoredContracts: addresses,
  } as NetworkData;
  return networkMap;
};

describe("NetworkManager test suite", () => {
  it("should return the correct contract address for each network", async () => {
    for (let testCase of TEST_CASES) {
        const [networkId, monitoredContracts] = testCase;

        const networkMap: Record<number, NetworkData> = generateNetworkMap(networkId, monitoredContracts);
        const networkManager = new NetworkManager(networkMap);
        networkManager.setNetwork(networkId);
        
        expect(networkManager.monitoredContracts).toStrictEqual(monitoredContracts);
    }
  });

  it("should throw error from using unsupported network", async () => {
    for (let testCase of TEST_CASES) {
        const [networkId, monitoredContracts] = testCase;

        const networkMap: Record<number, NetworkData> = generateNetworkMap(networkId, monitoredContracts);
        const networkManager = new NetworkManager(networkMap);

        expect(() => {
            // 99 is an unsupported networkId
            networkManager.setNetwork(99);
        }).toThrow(new Error("You are running the bot in a non supported network"));
    }
  });
});