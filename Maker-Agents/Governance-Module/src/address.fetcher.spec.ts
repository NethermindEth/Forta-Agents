import AddressFetcher from "./address.fetcher";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { CHAINLOG_IFACE } from "./abi";
import config from "./config";
import { formatBytes32String } from "ethers/lib/utils";

describe("AddressFetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  let fetcher: AddressFetcher = new AddressFetcher(mockProvider as any, config.CHAINLOG_CONTRACT);

  // Format: [chiefAddress, blockNumber]
  const TEST_CASES: [string, number][] = [
    [createAddress("0x1"), 1],
    [createAddress("0x2"), 2],
    [createAddress("0x3"), 3],
    [createAddress("0x4"), 4],
  ];

  fetcher = new AddressFetcher(mockProvider as any, config.CHAINLOG_CONTRACT);
  const key: string = formatBytes32String("MCD_ADM"); // chief contract's key value

  function createGetAddressCall(blockNumber: number, chiefAddress: string) {
    mockProvider.addCallTo(config.CHAINLOG_CONTRACT, blockNumber, CHAINLOG_IFACE, "getAddress", {
      inputs: [key],
      outputs: [chiefAddress],
    });
  }

  it("should store correct MCD_ADM address", async () => {
    for (let [chiefAddress, blockNumber] of TEST_CASES) {
      createGetAddressCall(blockNumber, chiefAddress);
      const fetchedChiefAddress: string = await fetcher.getChiefAddress(blockNumber);
      expect(fetchedChiefAddress).toStrictEqual(chiefAddress);
    }
  });
});
