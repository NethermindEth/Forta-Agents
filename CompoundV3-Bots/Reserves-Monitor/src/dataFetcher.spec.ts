import { NetworkManager, createAddress } from "forta-agent-tools";
import { MockEthersProvider } from "forta-agent-tools/lib/test";
import { BigNumber, ethers } from "ethers";
import Fetcher from "./dataFetcher";
import { Interface } from "ethers/lib/utils";
import { RESERVES_ABI, TARGET_RESERVES_ABI } from "./constants";
import { NetworkData } from "./utils";
import { Network } from "forta-agent";

const IFACE = new Interface([RESERVES_ABI, TARGET_RESERVES_ABI]);
const network = Network.MAINNET;

describe("Fetcher test suite", () => {
  let mockProvider: MockEthersProvider;
  let networkManager: NetworkManager<NetworkData>;
  let fetcher: Fetcher;

  // Format: [targetReserves, reserves, blockNumber]
  const TEST_CASES: [BigNumber, BigNumber, number][] = [
    [BigNumber.from("100"), BigNumber.from("800"), 1],
    [BigNumber.from("200"), BigNumber.from("900"), 2],
    [BigNumber.from("300"), BigNumber.from("100"), 3],
    [BigNumber.from("400"), BigNumber.from("400"), 4],
  ];

  const COMET_ADDRESSES = [
    createAddress("0x11"),
    createAddress("0x12"),
    createAddress("0x13"),
  ];

  const ALERT_FREQ = 1000;

  const DEFAULT_CONFIG = {
    [network]: {
      cometAddresses: COMET_ADDRESSES,
      alertFrequency: ALERT_FREQ,
    },
  };
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

  beforeEach(async () => {
    mockProvider = new MockEthersProvider();
    mockProvider.setNetwork(network);

    networkManager = new NetworkManager(DEFAULT_CONFIG);
    await networkManager.init(
      mockProvider as unknown as ethers.providers.Provider
    );
    networkManager.setNetwork(network);

    fetcher = new Fetcher(mockProvider as any, networkManager);
    fetcher.setContracts();
  });

  it("should fetch correct reserves amounts for each contract and block", async () => {
    for (const comet of COMET_ADDRESSES) {
      for (const [, reserves, blockNumber] of TEST_CASES) {
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
    for (const comet of COMET_ADDRESSES) {
      for (const [targetReserves, , blockNumber] of TEST_CASES) {
        createTargetReservesCall(comet, targetReserves, blockNumber);

        const fetchedTargetReserves: BigNumber =
          await fetcher.getTargetReserves(comet, blockNumber);

        expect(fetchedTargetReserves).toStrictEqual(targetReserves);
      }
    }
  });
});
