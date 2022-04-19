import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import AddressFetcher from "./address.fetcher";
import { CHAINLOG_ADDRESS, CHAINLOG_IFACE, ESM_KEY_BYTES } from "./utils";

describe("AddressFetcher test suite", () => {
  // Format: [esmAddress, blockNumber]
  const TEST_CASES: [string, number][] = [
    [createAddress("0x1"), 1],
    [createAddress("0x2"), 2],
    [createAddress("0x3"), 3],
    [createAddress("0x4"), 4],
  ];
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const fetcher: AddressFetcher = new AddressFetcher(mockProvider as any, CHAINLOG_ADDRESS);

  function createGetAddressCall(blockNumber: number, esmAddress: string) {
    return mockProvider.addCallTo(CHAINLOG_ADDRESS, blockNumber, CHAINLOG_IFACE, "getAddress", {
      inputs: [ESM_KEY_BYTES],
      outputs: [esmAddress],
    });
  }

  beforeEach(() => mockProvider.clear());

  it("should store correct MCD_ESM address", async () => {
    for (let [esmAddress, blockNumber] of TEST_CASES) {
      createGetAddressCall(blockNumber, esmAddress);

      const fetchedEsmAddress: string = await fetcher.getEsmAddress(blockNumber);
      expect(fetchedEsmAddress).toStrictEqual(esmAddress);
    }
  });
});
