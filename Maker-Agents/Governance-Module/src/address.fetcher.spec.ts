import AddressFetcher from "./address.fetcher";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { CHAINLOG_IFACE } from "./abi";
import config from "./config";
import { formatBytes32String } from "ethers/lib/utils";

describe("AddressFetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  let fetcher: AddressFetcher;
  const CHIEF_CONTRACT: string = createAddress("0x1");

  const initialize = () => {
    fetcher = new AddressFetcher(mockProvider as any, config.CHAINLOG_CONTRACT);
    mockProvider.clear();
    const key: string = formatBytes32String("MCD_ADM"); // chief contract's key value

    // call to getAddress
    mockProvider.addCallTo(config.CHAINLOG_CONTRACT, 1, CHAINLOG_IFACE, "getAddress", {
      inputs: [key],
      outputs: [CHIEF_CONTRACT],
    });
  };

  it("should store correct MCD_ADM address", async () => {
    initialize();
    await fetcher.getChiefAddress(1);
    expect(fetcher.chiefAddress).toStrictEqual(createAddress("0x1"));
  });
});
