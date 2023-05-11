import { createAddress } from "forta-agent-tools";
import { MockEthersProvider } from "forta-agent-tools/lib/test";
import { BigNumber } from "ethers";
import Fetcher from "./dataFetcher";
import { Interface } from "ethers/lib/utils";
import { RESERVES_ABI, TARGET_RESERVES_ABI } from "./constants";

describe("Fetcher test suite", () => {
  const IFACE = new Interface([RESERVES_ABI, TARGET_RESERVES_ABI]);

  // Format: [targetReserves, reserves, blockNumber]
  const TEST_CASES: [BigNumber, BigNumber, number][] = [
    [BigNumber.from("100"), BigNumber.from("800"), 1],
    [BigNumber.from("200"), BigNumber.from("900"), 2],
    [BigNumber.from("300"), BigNumber.from("100"), 3],
    [BigNumber.from("400"), BigNumber.from("400"), 4],
  ];

  const TEST_ADDRESSES = [
    createAddress("0x11"),
    createAddress("0x12"),
    createAddress("0x13"),
  ];

  const mockGetFn = (id: string) => {
    if (id == "cometAddresses") return TEST_ADDRESSES;
  };
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockNetworkManager = {
    cometAddresses: TEST_ADDRESSES,
    networkMap: {},
    setNetwork: jest.fn(),
    get: mockGetFn as any,
  };

  const fetcher = new Fetcher(mockProvider as any, mockNetworkManager as any);
  function createGetReservesCall(
    comet: string,
    reserves: BigNumber,
    blockNumber: number
  ) {
    return mockProvider.addCallTo(comet, blockNumber, IFACE, "getReserves", {
      inputs: [],
      outputs: [reserves],
    });
  }
  function createTargetReservesCall(
    comet: string,
    targetReserves: BigNumber,
    blockNumber: number
  ) {
    return mockProvider.addCallTo(comet, blockNumber, IFACE, "targetReserves", {
      inputs: [],
      outputs: [targetReserves],
    });
  }
  beforeAll(async () => {
    await fetcher.setContracts();
  });
  beforeEach(() => mockProvider.clear());

  it("should fetch correct reserves amounts for each contract and block", async () => {
    for (let comet of TEST_ADDRESSES) {
      for (let [, reserves, blockNumber] of TEST_CASES) {
        createGetReservesCall(comet, reserves, blockNumber);

        const fetchedReserves: BigNumber = await fetcher.getReserves(
          comet,
          blockNumber
        );

        expect(fetchedReserves).toStrictEqual(reserves);
      }
    }
  });

  it("should fetch correct target reserves amounts for each contract and block", async () => {
    for (let comet of TEST_ADDRESSES) {
      for (let [targetReserves, , blockNumber] of TEST_CASES) {
        createTargetReservesCall(comet, targetReserves, blockNumber);

        const fetchedTargetReserves: BigNumber =
          await fetcher.getTargetReserves(comet, blockNumber);

        expect(fetchedTargetReserves).toStrictEqual(targetReserves);
      }
    }
  });
});
