import { Network, ethers } from "forta-agent";
import { NetworkManager, createChecksumAddress } from "forta-agent-tools";
import { MockEthersProvider } from "forta-agent-tools/lib/test";
import Fetcher from "./dataFetcher";
import { RESERVES_ABI, TARGET_RESERVES_ABI } from "./constants";
import { NetworkData } from "./utils";

const bn = ethers.BigNumber.from;
const addr = createChecksumAddress;

const IFACE = new ethers.utils.Interface([RESERVES_ABI, TARGET_RESERVES_ABI]);
const NETWORK = Network.MAINNET;

describe("Fetcher test suite", () => {
  let mockProvider: MockEthersProvider;
  let provider: ethers.providers.Provider;
  let networkManager: NetworkManager<NetworkData>;
  let fetcher: Fetcher;

  // Format: [targetReserves, reserves, blockNumber]
  const TEST_CASES: [ethers.BigNumber, ethers.BigNumber, number][] = [
    [bn("100"), bn("800"), 1],
    [bn("200"), bn("900"), 2],
    [bn("300"), bn("100"), 3],
    [bn("400"), bn("400"), 4],
  ];

  const COMET_ADDRESSES = [addr("0x11"), addr("0x12"), addr("0x13")];

  const ALERT_INTERVAL = 1000;

  const DEFAULT_CONFIG = {
    [NETWORK]: {
      cometAddresses: COMET_ADDRESSES,
      alertInterval: ALERT_INTERVAL,
    },
  };

  function createGetReservesCall(
    comet: string,
    reserves: ethers.BigNumber,
    blockNumber: number
  ) {
    return mockProvider.addCallTo(comet, blockNumber, IFACE, "getReserves", {
      inputs: [],
      outputs: [reserves],
    });
  }

  function createTargetReservesCall(
    comet: string,
    targetReserves: ethers.BigNumber,
    blockNumber: number
  ) {
    return mockProvider.addCallTo(comet, blockNumber, IFACE, "targetReserves", {
      inputs: [],
      outputs: [targetReserves],
    });
  }

  beforeEach(async () => {
    mockProvider = new MockEthersProvider();
    mockProvider.setNetwork(NETWORK);
    provider = mockProvider as unknown as ethers.providers.Provider;

    networkManager = new NetworkManager(DEFAULT_CONFIG);
    await networkManager.init(provider);

    fetcher = new Fetcher();
    fetcher.loadContracts(networkManager, provider);
  });

  it("should fetch correct reserves amounts for each contract and block", async () => {
    for (const comet of COMET_ADDRESSES) {
      for (const [, reserves, blockNumber] of TEST_CASES) {
        createGetReservesCall(comet, reserves, blockNumber);

        const fetchedReserves = await fetcher.getReserves(comet, blockNumber);

        expect(fetchedReserves).toStrictEqual(reserves);
      }
    }
  });

  it("should fetch correct target reserves amounts for each contract and block", async () => {
    for (const comet of COMET_ADDRESSES) {
      for (const [targetReserves, , blockNumber] of TEST_CASES) {
        createTargetReservesCall(comet, targetReserves, blockNumber);

        const fetchedTargetReserves = await fetcher.getTargetReserves(
          comet,
          blockNumber
        );

        expect(fetchedTargetReserves).toStrictEqual(targetReserves);
      }
    }
  });
});
