import AddressesFetcher from "./addresses.fetcher";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { CHAIN_LOG, FUNCTIONS_ABIS } from "./utils";
import { formatBytes32String, Interface } from "ethers/lib/utils";

describe("AddressesFetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  let fetcher: AddressesFetcher = new AddressesFetcher(mockProvider as any, CHAIN_LOG);

  const CONTRACTS: Map<string, string>[] = [
    // block 1
    new Map<string, string>([
      [formatBytes32String("PIP_ONE"), createAddress("0xa1")],
      [formatBytes32String("PIP_TWO"), createAddress("0xa2")],
      [formatBytes32String("PIP_THREE"), createAddress("0xa3")],
      [formatBytes32String("NOPIP_ONE"), createAddress("0xa4")],
      [formatBytes32String("NOPIP_TWO"), createAddress("0xa5")],
      [formatBytes32String("NOPIP_THREE"), createAddress("0xa6")],
    ]),
    // block 2
    new Map<string, string>([
      [formatBytes32String("PIP_ONE"), createAddress("0xa12")],
      [formatBytes32String("PIP_TWO"), createAddress("0xa22")],
      [formatBytes32String("PIP_THREE"), createAddress("0xa32")],
      [formatBytes32String("NOPIP_ONE"), createAddress("0xa42")],
      [formatBytes32String("NOPIP_TWO"), createAddress("0xa52")],
      [formatBytes32String("NOPIP_THREE"), createAddress("0xa62")],
    ]),
    // block 3
    new Map<string, string>([
      [formatBytes32String("PIP_ONE"), createAddress("0xa13")],
      [formatBytes32String("PIP_TWO"), createAddress("0xa23")],
      [formatBytes32String("PIP_THREE"), createAddress("0xa33")],
      [formatBytes32String("NOPIP_ONE"), createAddress("0xa43")],
      [formatBytes32String("NOPIP_TWO"), createAddress("0xa53")],
      [formatBytes32String("NOPIP_THREE"), createAddress("0xa63")],
    ]),
  ];
  beforeAll(() => {
    for (let i = 0; i < CONTRACTS.length; i++) {
      const block = i + 1;
      // call to list
      mockProvider.addCallTo(CHAIN_LOG, block, new Interface(FUNCTIONS_ABIS), "list", {
        inputs: [],
        outputs: [Array.from(CONTRACTS[i].keys())],
      });
      // call to getAddress
      CONTRACTS[i].forEach((address, key) => {
        mockProvider.addCallTo(CHAIN_LOG, block, new Interface(FUNCTIONS_ABIS), "getAddress", {
          inputs: [key],
          outputs: [address.toLowerCase()],
        });
      });
    }
  });

  it("should store only PIP_ prefixed addresses", async () => {
    for (let block = 1; block <= CONTRACTS.length; block++) {
      await fetcher.getOsmAddresses(block);

      expect(fetcher.osmContracts).toStrictEqual(
        new Map<string, string>([
          [formatBytes32String("PIP_ONE"), CONTRACTS[block - 1].get(formatBytes32String("PIP_ONE")) as string],
          [formatBytes32String("PIP_TWO"), CONTRACTS[block - 1].get(formatBytes32String("PIP_TWO")) as string],
          [formatBytes32String("PIP_THREE"), CONTRACTS[block - 1].get(formatBytes32String("PIP_THREE")) as string],
        ])
      );
    }
  });

  it("should update the addresses correctly", async () => {
    for (let block = 1; block <= CONTRACTS.length; block++) {
      await fetcher.getOsmAddresses(block);

      fetcher.updateAddresses("UpdateAddress", [formatBytes32String("PIP_FOUR"), createAddress("0xa7")]);
      expect(fetcher.osmContracts).toStrictEqual(
        new Map<string, string>([
          [formatBytes32String("PIP_ONE"), CONTRACTS[block - 1].get(formatBytes32String("PIP_ONE")) as string],
          [formatBytes32String("PIP_TWO"), CONTRACTS[block - 1].get(formatBytes32String("PIP_TWO")) as string],
          [formatBytes32String("PIP_THREE"), CONTRACTS[block - 1].get(formatBytes32String("PIP_THREE")) as string],
          [formatBytes32String("PIP_FOUR"), createAddress("0xa7")],
        ])
      );

      fetcher.updateAddresses("RemoveAddress", [formatBytes32String("PIP_ONE")]);
      expect(fetcher.osmContracts).toStrictEqual(
        new Map<string, string>([
          [formatBytes32String("PIP_TWO"), CONTRACTS[block - 1].get(formatBytes32String("PIP_TWO")) as string],
          [formatBytes32String("PIP_THREE"), CONTRACTS[block - 1].get(formatBytes32String("PIP_THREE")) as string],
          [formatBytes32String("PIP_FOUR"), createAddress("0xa7")],
        ])
      );
    }
  });
});
