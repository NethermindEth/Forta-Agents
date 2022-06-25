import { ethers, Finding, FindingSeverity, FindingType, HandleBlock, Network } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { createAddress, MockEthersProvider, TestBlockEvent } from "forta-agent-tools/lib/tests";
import { provideHandleBlock } from "./agent";
import { AMP_UPDATE_STARTED_ABI } from "./constants";
import { AgentConfig, GetAmpUpdateStartedLog, NetworkData, provideGetAmpUpdateStartedLogs } from "./utils";

const createChecksumAddress = (address: string) => ethers.utils.getAddress(createAddress(address.toLowerCase()));

const STABLE_POOL_IFACE = new ethers.utils.Interface([AMP_UPDATE_STARTED_ABI]);
const IRRELEVANT_IFACE = new ethers.utils.Interface(["event Event()"]);

const getAmpUpdateStartedLog = (
  emitter: string,
  block: number,
  startValue: ethers.BigNumberish,
  endValue: ethers.BigNumberish,
  startTime: ethers.BigNumberish,
  endTime: ethers.BigNumberish
): ethers.providers.Log => {
  return {
    address: emitter,
    blockNumber: block,
    ...STABLE_POOL_IFACE.encodeEventLog(
      STABLE_POOL_IFACE.getEvent("AmpUpdateStarted"),
      [startValue, endValue, startTime, endTime].map((el) => ethers.BigNumber.from(el))
    ),
  } as ethers.providers.Log;
};

const getIrrelevantLog = (emitter: string, block: number): ethers.providers.Log => {
  return {
    address: emitter,
    blockNumber: block,
    ...IRRELEVANT_IFACE.encodeEventLog(IRRELEVANT_IFACE.getEvent("Event"), []),
  } as ethers.providers.Log;
};

export function createAbsoluteThresholdFinding(pool: string, endValue: string): Finding {
  return Finding.from({
    name: "Low Stable Pool Amplification Parameter",
    description: "A low amplification parameter endValue was detected in a stable pool",
    alertId: "BAL-9-1",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    metadata: {
      pool,
      endValue: endValue,
    },
  });
}

export function createPercentageThresholdFinding(pool: string, endValue: string, decreasePercentage: string): Finding {
  return Finding.from({
    name: "High Stable Pool Amplification Parameter Decrease",
    description: "A stable pool amplification parameter will be significantly decreased",
    alertId: "BAL-9-2",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    metadata: {
      pool,
      endValue: endValue,
      decreasePercentage: decreasePercentage,
    },
  });
}

const STABLE_POOL_ADDRESSES = [createChecksumAddress("0xdef1"), createChecksumAddress("0x4001")];

const ADDRESSES = new Array(10).fill(0).map((el, idx) => createChecksumAddress(`0x${idx + 1}`));

describe("Bot Test Suite", () => {
  let provider: ethers.providers.Provider;
  let mockProvider: MockEthersProvider;
  let networkManager: NetworkManager<NetworkData>;
  let handleBlock: HandleBlock;
  let getAmpUpdateStartedLogs: GetAmpUpdateStartedLog;
  let absoluteThreshold: string | undefined;
  let percentageThreshold: string | undefined;

  const CONFIG: AgentConfig = {
    [Network.MAINNET]: {
      stablePoolAddresses: STABLE_POOL_ADDRESSES,
      get absoluteThreshold() {
        return absoluteThreshold;
      },
      get percentageThreshold() {
        return percentageThreshold;
      },
    },
  };

  describe("getAmpUpdateStartedLogs", () => {
    beforeEach(() => {
      mockProvider = new MockEthersProvider();
      provider = mockProvider as unknown as ethers.providers.Provider;
      networkManager = new NetworkManager(CONFIG, Network.MAINNET);

      getAmpUpdateStartedLogs = provideGetAmpUpdateStartedLogs(networkManager, provider);
    });

    it("should ignore target events emitted from another contract", async () => {
      const blockEvent = new TestBlockEvent().setNumber(0);

      mockProvider.addLogs([getAmpUpdateStartedLog(ADDRESSES[0], 0, 0, 0, 0, 0)]);

      expect(await getAmpUpdateStartedLogs(blockEvent.blockNumber)).toStrictEqual([]);
    });

    it("should ignore other events emitted from a target contract", async () => {
      const blockEvent = new TestBlockEvent().setNumber(0);

      mockProvider.addLogs([
        getIrrelevantLog(STABLE_POOL_ADDRESSES[0], 0),
        getIrrelevantLog(STABLE_POOL_ADDRESSES[1], 0),
      ]);

      expect(await getAmpUpdateStartedLogs(blockEvent.blockNumber)).toStrictEqual([]);
    });

    it("should ignore target events emitted in another block", async () => {
      const blockEvent = new TestBlockEvent().setNumber(0);

      mockProvider.addLogs([
        getAmpUpdateStartedLog(STABLE_POOL_ADDRESSES[0], 1, 0, 0, 0, 0),
        getAmpUpdateStartedLog(STABLE_POOL_ADDRESSES[1], 1, 0, 0, 0, 0),
      ]);

      expect(await getAmpUpdateStartedLogs(blockEvent.blockNumber)).toStrictEqual([]);
    });

    it("should get target events emitted from a target contract in the same block", async () => {
      const blockEvent = new TestBlockEvent().setNumber(0);

      mockProvider.addLogs([
        getAmpUpdateStartedLog(STABLE_POOL_ADDRESSES[0], 0, 1, 2, 3, 4),
        getAmpUpdateStartedLog(STABLE_POOL_ADDRESSES[1], 0, 5, 6, 7, 8),
      ]);

      const logs = await getAmpUpdateStartedLogs(blockEvent.blockNumber);

      expect(logs[0].emitter).toStrictEqual(STABLE_POOL_ADDRESSES[0]);
      expect(logs[0].name).toStrictEqual("AmpUpdateStarted");
      expect(logs[0].args.map((arg) => arg)).toStrictEqual([1, 2, 3, 4].map((el) => ethers.BigNumber.from(el)));
      expect(logs[1].emitter).toStrictEqual(STABLE_POOL_ADDRESSES[1]);
      expect(logs[1].name).toStrictEqual("AmpUpdateStarted");
      expect(logs[1].args.map((arg) => arg)).toStrictEqual([5, 6, 7, 8].map((el) => ethers.BigNumber.from(el)));
    });
  });

  describe("handleBlock", () => {
    beforeEach(() => {
      mockProvider = new MockEthersProvider();
      provider = mockProvider as unknown as ethers.providers.Provider;
      networkManager = new NetworkManager(CONFIG, Network.MAINNET);

      absoluteThreshold = undefined;
      percentageThreshold = undefined;

      handleBlock = provideHandleBlock(networkManager, provider);
    });

    it("should return empty findings with an empty logs list", async () => {
      const blockEvent = new TestBlockEvent();

      expect(await handleBlock(blockEvent)).toStrictEqual([]);
    });

    it("should not return a finding for an update that is not at or below the absolute threshold", async () => {
      const blockEvent = new TestBlockEvent().setNumber(0);

      absoluteThreshold = "10";

      mockProvider.addLogs([getAmpUpdateStartedLog(STABLE_POOL_ADDRESSES[0], 0, 0, 11, 0, 0)]);

      expect(await handleBlock(blockEvent)).toStrictEqual([]);
    });

    it("should not return a finding for an update that is not at or above the percentage decrease threshold", async () => {
      const blockEvent = new TestBlockEvent().setNumber(0);

      percentageThreshold = "10";

      mockProvider.addLogs([getAmpUpdateStartedLog(STABLE_POOL_ADDRESSES[0], 0, 100, 99, 0, 0)]);

      expect(await handleBlock(blockEvent)).toStrictEqual([]);
    });

    it("should return a finding for an update that is at or below the absolute threshold", async () => {
      const blockEvent = new TestBlockEvent().setNumber(0);

      absoluteThreshold = "10";

      mockProvider.addLogs([getAmpUpdateStartedLog(STABLE_POOL_ADDRESSES[0], 0, 0, 9, 0, 0)]);

      expect(await handleBlock(blockEvent)).toStrictEqual([
        createAbsoluteThresholdFinding(STABLE_POOL_ADDRESSES[0], "9"),
      ]);
    });

    it("should return a finding for an update that is at or above the percentage decrease threshold", async () => {
      const blockEvent = new TestBlockEvent().setNumber(0);

      percentageThreshold = "10";

      mockProvider.addLogs([getAmpUpdateStartedLog(STABLE_POOL_ADDRESSES[0], 0, 1000, 899, 0, 0)]);

      expect(await handleBlock(blockEvent)).toStrictEqual([
        createPercentageThresholdFinding(STABLE_POOL_ADDRESSES[0], "899", "10.1"),
      ]);
    });

    it("should return both findings for an update if it satisfies both thresholds", async () => {
      const blockEvent = new TestBlockEvent().setNumber(0);

      percentageThreshold = "10";
      absoluteThreshold = "1000";

      mockProvider.addLogs([getAmpUpdateStartedLog(STABLE_POOL_ADDRESSES[0], 0, 1000, 899, 0, 0)]);

      expect(await handleBlock(blockEvent)).toStrictEqual([
        createAbsoluteThresholdFinding(STABLE_POOL_ADDRESSES[0], "899"),
        createPercentageThresholdFinding(STABLE_POOL_ADDRESSES[0], "899", "10.1"),
      ]);
    });

    it("should multiple findings for multiple updates that satisfy one or more thresholds", async () => {
      const blockEvent = new TestBlockEvent().setNumber(0);

      percentageThreshold = "10";
      absoluteThreshold = "1000";

      mockProvider.addLogs([
        getAmpUpdateStartedLog(STABLE_POOL_ADDRESSES[0], 0, 1000, 1100, 0, 0), // no findings
        getAmpUpdateStartedLog(STABLE_POOL_ADDRESSES[1], 0, 2000, 1900, 0, 0), // no findings
        getAmpUpdateStartedLog(STABLE_POOL_ADDRESSES[0], 0, 1000, 999, 0, 0), // absolute threshold finding
        getAmpUpdateStartedLog(STABLE_POOL_ADDRESSES[1], 0, 2000, 1800, 0, 0), // percentage threshold finding
        getAmpUpdateStartedLog(STABLE_POOL_ADDRESSES[0], 0, 1000, 875, 0, 0), // both findings
      ]);

      expect(await handleBlock(blockEvent)).toStrictEqual([
        createAbsoluteThresholdFinding(STABLE_POOL_ADDRESSES[0], "999"),
        createPercentageThresholdFinding(STABLE_POOL_ADDRESSES[1], "1800", "10"),
        createAbsoluteThresholdFinding(STABLE_POOL_ADDRESSES[0], "875"),
        createPercentageThresholdFinding(STABLE_POOL_ADDRESSES[0], "875", "12.5"),
      ]);
    });
  });
});
