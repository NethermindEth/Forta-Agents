import AddressFetcher from "./address.fetcher";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { CHAINLOG_ADDRESS, CHAINLOG_IFACE } from "./utils";
import { formatBytes32String } from "ethers/lib/utils";

describe("AddressFetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  let fetcher: AddressFetcher;
  const ESM_CONTRACT: string = createAddress("0x1");

  const initialize = () => {
    fetcher = new AddressFetcher(mockProvider as any, CHAINLOG_ADDRESS);
    mockProvider.clear();
    const key: string = formatBytes32String("MCD_ESM"); // ESM contract's key value

    // call to getAddress
    mockProvider.addCallTo(CHAINLOG_ADDRESS, 1, CHAINLOG_IFACE, "getAddress", {
      inputs: [key],
      outputs: [ESM_CONTRACT],
    });
  };

  it("should store correct MCD_ESM address", async () => {
    initialize();
    await fetcher.getEsmAddress(1);
    expect(fetcher.esmAddress).toStrictEqual(ESM_CONTRACT);
  });
});
