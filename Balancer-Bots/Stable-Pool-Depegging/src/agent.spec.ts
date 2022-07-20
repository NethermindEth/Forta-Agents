import { ethers, Finding, FindingSeverity, FindingType, HandleTransaction, Network } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { createAddress, MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
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

function createValueThresholdFinding(pool: string, startValue: string, endValue: string): Finding {
  return Finding.from({
    name: "Low Stable Pool Amplification Parameter",
    description: "A low amplification parameter endValue was detected in a stable pool",
    alertId: "BAL-9-1",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    metadata: {
      pool,
      startValue,
      endValue,
    },
  });
}

function createDecreaseThresholdFinding(pool: string, startValue: string, endValue: string, decrease: string): Finding {
  return Finding.from({
    name: "High Stable Pool Amplification Parameter Decrease",
    description: "A stable pool amplification parameter will have a significant decrease",
    alertId: "BAL-9-2",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    metadata: {
      pool,
      startValue,
      endValue,
      decrease,
    },
  });
}

function createDecreasePercentageThresholdFinding(
  pool: string,
  startValue: string,
  endValue: string,
  decreasePercentage: string
): Finding {
  return Finding.from({
    name: "High Stable Pool Amplification Parameter Decrease",
    description: "A stable pool amplification parameter will have a significant decrease in percentage",
    alertId: "BAL-9-3",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    metadata: {
      pool,
      startValue,
      endValue,
      decreasePercentage,
    },
  });
}

const STABLE_POOL_ADDRESSES = [createChecksumAddress("0x2001"), createChecksumAddress("0x4001")];

const ADDRESSES = new Array(10).fill(0).map((el, idx) => createChecksumAddress(`0x${idx + 1}`));

describe("Bot Test Suite", () => {
  let provider: ethers.providers.Provider;
  let mockProvider: MockEthersProvider;
  let networkManager: NetworkManager<NetworkData>;
  let handleTransaction: HandleTransaction;
  let getAmpUpdateStartedLogs: GetAmpUpdateStartedLog;

  let valueThreshold: string | undefined;
  let decreasePercentageThreshold: string | undefined;
  let decreaseThreshold: string | undefined;

  const CONFIG: AgentConfig = {
    [Network.MAINNET]: {
      stablePoolAddresses: STABLE_POOL_ADDRESSES,
      get valueThreshold() {
        return valueThreshold;
      },
      get decreasePercentageThreshold() {
        return decreasePercentageThreshold;
      },
      get decreaseThreshold() {
        return decreaseThreshold;
      },
    },
  };

  describe("getAmpUpdateStartedLogs", () => {
    beforeEach(() => {
      mockProvider = new MockEthersProvider();
      provider = mockProvider as unknown as ethers.providers.Provider;
      networkManager = new NetworkManager(CONFIG, Network.MAINNET);

      getAmpUpdateStartedLogs = provideGetAmpUpdateStartedLogs(networkManager);
    });

    it("should ignore target events emitted from another contract", async () => {
      const txEvent = new TestTransactionEvent()
        .setBlock(0)
        .addInterfaceEventLog(STABLE_POOL_IFACE.getEvent("AmpUpdateStarted"), ADDRESSES[0], [0, 0, 0, 0]);

      expect(await getAmpUpdateStartedLogs(txEvent)).toStrictEqual([]);
    });

    it("should ignore other events emitted from a target contract", async () => {
      const txEvent = new TestTransactionEvent()
        .setBlock(0)
        .addInterfaceEventLog(IRRELEVANT_IFACE.getEvent("Event"), STABLE_POOL_ADDRESSES[0], []);

      expect(await getAmpUpdateStartedLogs(txEvent)).toStrictEqual([]);
    });

    it("should get target events emitted from a target contract in the same block", async () => {
      const txEvent = new TestTransactionEvent()
        .setBlock(0)
        .addInterfaceEventLog(STABLE_POOL_IFACE.getEvent("AmpUpdateStarted"), STABLE_POOL_ADDRESSES[0], [1, 2, 3, 4])
        .addInterfaceEventLog(STABLE_POOL_IFACE.getEvent("AmpUpdateStarted"), STABLE_POOL_ADDRESSES[1], [5, 6, 7, 8]);

      const logs = await getAmpUpdateStartedLogs(txEvent);

      expect(logs[0].emitter).toStrictEqual(STABLE_POOL_ADDRESSES[0]);
      expect(logs[0].name).toStrictEqual("AmpUpdateStarted");
      expect(logs[0].args.map((arg) => arg)).toStrictEqual([1, 2, 3, 4].map((el) => ethers.BigNumber.from(el)));
      expect(logs[1].emitter).toStrictEqual(STABLE_POOL_ADDRESSES[1]);
      expect(logs[1].name).toStrictEqual("AmpUpdateStarted");
      expect(logs[1].args.map((arg) => arg)).toStrictEqual([5, 6, 7, 8].map((el) => ethers.BigNumber.from(el)));
    });
  });

  describe("handleTransaction", () => {
    beforeEach(() => {
      mockProvider = new MockEthersProvider();
      provider = mockProvider as unknown as ethers.providers.Provider;
      networkManager = new NetworkManager(CONFIG, Network.MAINNET);
      valueThreshold = undefined;
      decreasePercentageThreshold = undefined;
      decreaseThreshold = undefined;
      handleTransaction = provideHandleTransaction(networkManager, provider);
    });

    it("should return empty findings with an empty logs list", async () => {
      const txEvent = new TestTransactionEvent();
      expect(await handleTransaction(txEvent)).toStrictEqual([]);
    });

    it("should not return a finding for an update that is not at or below the value threshold", async () => {
      const txEvent = new TestTransactionEvent()
        .setBlock(0)
        .addInterfaceEventLog(STABLE_POOL_IFACE.getEvent("AmpUpdateStarted"), STABLE_POOL_ADDRESSES[0], [0, 11, 0, 0]);

      valueThreshold = "10";

      expect(await handleTransaction(txEvent)).toStrictEqual([]);
    });

    it("should not return a finding for an update that is not at or above the percentage decrease threshold", async () => {
      const txEvent = new TestTransactionEvent()
        .setBlock(0)
        .addInterfaceEventLog(
          STABLE_POOL_IFACE.getEvent("AmpUpdateStarted"),
          STABLE_POOL_ADDRESSES[0],
          [100, 99, 0, 0]
        );

      decreasePercentageThreshold = "10";

      expect(await handleTransaction(txEvent)).toStrictEqual([]);
    });

    it("should return a finding for an update that is at or below the value threshold", async () => {
      const txEvent = new TestTransactionEvent()
        .setBlock(0)
        .addInterfaceEventLog(STABLE_POOL_IFACE.getEvent("AmpUpdateStarted"), STABLE_POOL_ADDRESSES[0], [0, 9, 0, 0]);

      valueThreshold = "10";

      expect(await handleTransaction(txEvent)).toStrictEqual([
        createValueThresholdFinding(STABLE_POOL_ADDRESSES[0], "0", "9"),
      ]);
    });

    it("should return a finding for an update that is at or above the decrease threshold", async () => {
      const txEvent = new TestTransactionEvent()
        .setBlock(0)
        .addInterfaceEventLog(
          STABLE_POOL_IFACE.getEvent("AmpUpdateStarted"),
          STABLE_POOL_ADDRESSES[0],
          [1000, 900, 0, 0]
        );

      decreaseThreshold = "100";

      expect(await handleTransaction(txEvent)).toStrictEqual([
        createDecreaseThresholdFinding(STABLE_POOL_ADDRESSES[0], "1000", "900", "100"),
      ]);
    });

    it("should return a finding for an update that is at or above the percentage decrease threshold", async () => {
      const txEvent = new TestTransactionEvent()
        .setBlock(0)
        .addInterfaceEventLog(
          STABLE_POOL_IFACE.getEvent("AmpUpdateStarted"),
          STABLE_POOL_ADDRESSES[0],
          [1000, 899, 0, 0]
        );
      decreasePercentageThreshold = "10";

      expect(await handleTransaction(txEvent)).toStrictEqual([
        createDecreasePercentageThresholdFinding(STABLE_POOL_ADDRESSES[0], "1000", "899", "10.1"),
      ]);
    });

    it("should return all findings for an update if it satisfies all thresholds", async () => {
      const txEvent = new TestTransactionEvent()
        .setBlock(0)
        .addInterfaceEventLog(
          STABLE_POOL_IFACE.getEvent("AmpUpdateStarted"),
          STABLE_POOL_ADDRESSES[0],
          [1000, 899, 0, 0]
        );

      decreasePercentageThreshold = "10";
      decreaseThreshold = "100";
      valueThreshold = "1000";

      expect(await handleTransaction(txEvent)).toStrictEqual([
        createValueThresholdFinding(STABLE_POOL_ADDRESSES[0], "1000", "899"),
        createDecreaseThresholdFinding(STABLE_POOL_ADDRESSES[0], "1000", "899", "101"),
        createDecreasePercentageThresholdFinding(STABLE_POOL_ADDRESSES[0], "1000", "899", "10.1"),
      ]);
    });
    it("should multiple findings for multiple updates that satisfy one or more thresholds", async () => {
      const txEvent = new TestTransactionEvent()
        .setBlock(0)
        .addInterfaceEventLog(
          STABLE_POOL_IFACE.getEvent("AmpUpdateStarted"),
          STABLE_POOL_ADDRESSES[0],
          [1000, 1100, 0, 0]
        )
        .addInterfaceEventLog(
          STABLE_POOL_IFACE.getEvent("AmpUpdateStarted"),
          STABLE_POOL_ADDRESSES[1],
          [2000, 1900, 0, 0]
        )
        .addInterfaceEventLog(
          STABLE_POOL_IFACE.getEvent("AmpUpdateStarted"),
          STABLE_POOL_ADDRESSES[0],
          [1000, 999, 0, 0]
        )
        .addInterfaceEventLog(STABLE_POOL_IFACE.getEvent("AmpUpdateStarted"), STABLE_POOL_ADDRESSES[1], [50, 45, 0, 0])
        .addInterfaceEventLog(
          STABLE_POOL_IFACE.getEvent("AmpUpdateStarted"),
          STABLE_POOL_ADDRESSES[0],
          [1000, 875, 0, 0]
        );

      decreasePercentageThreshold = "10";
      decreaseThreshold = "50";
      valueThreshold = "1000";

      expect(await handleTransaction(txEvent)).toStrictEqual([
        createDecreaseThresholdFinding(STABLE_POOL_ADDRESSES[1], "2000", "1900", "100"),
        createValueThresholdFinding(STABLE_POOL_ADDRESSES[0], "1000", "999"),
        createValueThresholdFinding(STABLE_POOL_ADDRESSES[1], "50", "45"),
        createDecreasePercentageThresholdFinding(STABLE_POOL_ADDRESSES[1], "50", "45", "10"),
        createValueThresholdFinding(STABLE_POOL_ADDRESSES[0], "1000", "875"),
        createDecreaseThresholdFinding(STABLE_POOL_ADDRESSES[0], "1000", "875", "125"),
        createDecreasePercentageThresholdFinding(STABLE_POOL_ADDRESSES[0], "1000", "875", "12.5"),
      ]);
    });
  });
});
