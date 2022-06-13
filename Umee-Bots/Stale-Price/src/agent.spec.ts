import { TestBlockEvent } from "forta-agent-tools/lib/tests.utils";
import { ethers, HandleBlock, HandleTransaction, Initialize } from "forta-agent";
import { createAddress, MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction, provideHandleBlock, provideInitialize } from "./agent";
import {
  AgentConfig,
  AssetData,
  ASSET_SOURCE_UPDATED_ABI,
  createFinding,
  GET_RESERVES_LIST_ABI,
  GET_SOURCE_OF_ASSET_ABI,
  LATEST_TIMESTAMP_ABI,
} from "./utils";

const DEFAULT_CONFIG: AgentConfig = {
  threshold: 86400,
  umeeOracleAddress: createAddress("0x024c1e"),
  lendingPoolAddress: createAddress("0x4e"),
};

const LENDING_POOL_IFACE = new ethers.utils.Interface([GET_RESERVES_LIST_ABI]);

const UMEE_ORACLE_IFACE = new ethers.utils.Interface([GET_SOURCE_OF_ASSET_ABI, ASSET_SOURCE_UPDATED_ABI]);

const SOURCE_IFACE = new ethers.utils.Interface([LATEST_TIMESTAMP_ABI]);

describe("Lending pool reentrancy agent tests suit", () => {
  let initialize: Initialize;
  let handleTransaction: HandleTransaction;
  let handleBlock: HandleBlock;
  let mockProvider: MockEthersProvider;
  let assetsDataList: AssetData[] = [];

  const resetAssetsDataList = () => (assetsDataList = []);

  const setReserves = (
    reserves: Array<{ asset: string; source: string; timestamps: Record<number | string, number> }>
  ) => {
    mockProvider.addCallTo(DEFAULT_CONFIG.lendingPoolAddress, "latest", LENDING_POOL_IFACE, "getReservesList", {
      inputs: [],
      outputs: [reserves.map((el) => el.asset)],
    });

    reserves.forEach((reserve) => {
      mockProvider.addCallTo(DEFAULT_CONFIG.umeeOracleAddress, "latest", UMEE_ORACLE_IFACE, "getSourceOfAsset", {
        inputs: [reserve.asset],
        outputs: [reserve.source],
      });

      Object.entries(reserve.timestamps).forEach(([block, timestamp]) => {
        mockProvider.addCallTo(
          reserve.source,
          block === "latest" ? block : parseInt(block),
          SOURCE_IFACE,
          "latestTimestamp",
          {
            inputs: [],
            outputs: [ethers.BigNumber.from(timestamp)],
          }
        );
      });
    });
  };

  const updateAssetSource = (txEvent: TestTransactionEvent, asset: string, source: string) => {
    txEvent.addInterfaceEventLog(UMEE_ORACLE_IFACE.getEvent("AssetSourceUpdated"), DEFAULT_CONFIG.umeeOracleAddress, [
      asset,
      source,
    ]);
  };

  const assetData = (asset: string, source: string, referenceTimestamp: number) => {
    return {
      asset: asset.toLowerCase(),
      source: source.toLowerCase(),
      referenceTimestamp,
    };
  };

  beforeEach(() => {
    mockProvider = new MockEthersProvider();
    resetAssetsDataList();

    initialize = provideInitialize(assetsDataList, mockProvider as any, DEFAULT_CONFIG);
    handleTransaction = provideHandleTransaction(mockProvider as any, DEFAULT_CONFIG);
    handleBlock = provideHandleBlock(mockProvider as any, DEFAULT_CONFIG);
  });

  describe("initialize", () => {
    it("should correctly load asset data", async () => {
      const reserves = [
        {
          asset: createAddress("0xA"),
          source: createAddress("0xB"),
          timestamps: {
            latest: 1,
            0: 2,
          },
        },
        {
          asset: createAddress("0xC"),
          source: createAddress("0xD"),
          timestamps: {
            latest: 3,
            0: 4,
          },
        },
        {
          asset: createAddress("0xE"),
          source: createAddress("0xF"),
          timestamps: {
            latest: 5,
            0: 6,
          },
        },
      ];

      setReserves(reserves);

      await initialize();

      expect(assetsDataList).toStrictEqual(reserves.map((el) => assetData(el.asset, el.source, el.timestamps.latest)));
    });
  });

  describe("handleTransaction", () => {
    it("should add a newly added asset to the monitoring list", async () => {
      const reserves = [
        {
          asset: createAddress("0xA"),
          source: createAddress("0xB"),
          timestamps: {
            latest: 1,
            0: 2,
          },
        },
        {
          asset: createAddress("0xC"),
          source: createAddress("0xD"),
          timestamps: {
            latest: 3,
            0: 4,
          },
        },
      ];

      setReserves(reserves);

      await initialize();

      const txEvent = new TestTransactionEvent().setTimestamp(0).setBlock(0);

      const newReserves = [
        {
          asset: createAddress("0x1A"),
          source: createAddress("0x1B"),
          timestamps: {
            0: 2,
          },
        },
        {
          asset: createAddress("0x1C"),
          source: createAddress("0x1D"),
          timestamps: {
            0: 4,
          },
        },
      ];

      setReserves(newReserves);
      newReserves.forEach((reserve) => {
        updateAssetSource(txEvent, reserve.asset, reserve.source);
      });

      await handleTransaction(txEvent);

      expect(assetsDataList).toStrictEqual([
        ...reserves.map((el) => assetData(el.asset, el.source, el.timestamps.latest)),
        ...newReserves.map((el) => assetData(el.asset, el.source, el.timestamps[0])),
      ]);
    });

    it("should update the source of an already monitored asset in the monitoring list", async () => {
      const reserves = [
        {
          asset: createAddress("0xA"),
          source: createAddress("0xB"),
          timestamps: {
            latest: 1,
            0: 2,
          },
        },
        {
          asset: createAddress("0xC"),
          source: createAddress("0xD"),
          timestamps: {
            latest: 3,
            0: 4,
          },
        },
        {
          asset: createAddress("0xE"),
          source: createAddress("0xF"),
          timestamps: {
            latest: 5,
            0: 6,
          },
        },
      ];

      setReserves(reserves);

      await initialize();

      const txEvent = new TestTransactionEvent().setTimestamp(0).setBlock(0);

      const newReserves = [
        {
          asset: createAddress("0xA"),
          source: createAddress("0x1B"),
          timestamps: {
            0: 2,
          },
        },
        {
          asset: createAddress("0xC"),
          source: createAddress("0x1D"),
          timestamps: {
            0: 4,
          },
        },
        {
          asset: createAddress("0xAA"),
          source: createAddress("0xAB"),
          timestamps: {
            0: 4,
          },
        },
      ];

      setReserves(newReserves);
      newReserves.forEach((reserve) => {
        updateAssetSource(txEvent, reserve.asset, reserve.source);
      });

      await handleTransaction(txEvent);

      expect(assetsDataList).toStrictEqual([
        assetData(reserves[0].asset, newReserves[0].source, newReserves[0].timestamps[0]),
        assetData(reserves[1].asset, newReserves[1].source, newReserves[1].timestamps[0]),
        assetData(reserves[2].asset, reserves[2].source, reserves[2].timestamps.latest),
        assetData(newReserves[2].asset, newReserves[2].source, newReserves[2].timestamps[0]),
      ]);
    });

    it("should emit findings if newly added or newly updated assets are stale", async () => {
      const reserves = [
        {
          asset: createAddress("0xA"),
          source: createAddress("0xB"),
          timestamps: {
            latest: 1,
            0: 2,
          },
        },
        {
          asset: createAddress("0xC"),
          source: createAddress("0xD"),
          timestamps: {
            latest: 3,
            0: 4,
          },
        },
      ];

      setReserves(reserves);

      await initialize();

      const txEvent = new TestTransactionEvent().setTimestamp(DEFAULT_CONFIG.threshold + 1).setBlock(0);

      const newReserves = [
        {
          asset: createAddress("0xA"),
          source: createAddress("0x1B"),
          timestamps: {
            0: 1,
          },
        },
        {
          asset: createAddress("0x1C"),
          source: createAddress("0x1D"),
          timestamps: {
            0: 1,
          },
        },
      ];

      setReserves(newReserves);
      newReserves.forEach((reserve) => {
        updateAssetSource(txEvent, reserve.asset, reserve.source);
      });

      expect(await handleTransaction(txEvent)).toStrictEqual(
        newReserves.map((el) => createFinding(assetData(el.asset, el.source, el.timestamps[0])))
      );
    });

    it("should not emit findings if there's errors in the lastTimestamp fetching", async () => {
      const reserves = [
        {
          asset: createAddress("0xA"),
          source: createAddress("0xB"),
          timestamps: {
            latest: 1,
            0: 2,
          },
        },
        {
          asset: createAddress("0xC"),
          source: createAddress("0xD"),
          timestamps: {
            latest: 3,
            0: 4,
          },
        },
      ];

      setReserves(reserves);

      await initialize();

      const txEvent = new TestTransactionEvent().setTimestamp(DEFAULT_CONFIG.threshold + 1).setBlock(0);

      const newReserves = [
        {
          asset: createAddress("0xA"),
          source: createAddress("0x1B"),
          timestamps: {},
        },
        {
          asset: createAddress("0x1C"),
          source: createAddress("0x1D"),
          timestamps: {},
        },
      ];

      setReserves(newReserves);
      newReserves.forEach((reserve) => {
        updateAssetSource(txEvent, reserve.asset, reserve.source);
      });

      expect(await handleTransaction(txEvent)).toStrictEqual([]);
    });
  });

  describe("handleBlock", () => {
    it("should not update the reference timestamp if the block timestamp is not at least threshold from the reference", async () => {
      const reserves = [
        {
          asset: createAddress("0xA"),
          source: createAddress("0xB"),
          timestamps: {
            latest: 1,
            0: 2,
          },
        },
      ];

      setReserves(reserves);
      await initialize();

      // getReservesList (1), getAssetSource (1), latestTimestamp (1)
      expect(mockProvider.call).toBeCalledTimes(1 + 1 + 1);

      const blockEvent = new TestBlockEvent().setNumber(0).setTimestamp(DEFAULT_CONFIG.threshold);

      expect(await handleBlock(blockEvent)).toStrictEqual([]);
      // no additional calls
      expect(mockProvider.call).toBeCalledTimes(3);
    });

    it("should return empty findings if the reserve source is not stale", async () => {
      const reserves = [
        {
          asset: createAddress("0xA"),
          source: createAddress("0xB"),
          timestamps: {
            latest: 1,
            0: 2,
          },
        },
        {
          asset: createAddress("0xC"),
          source: createAddress("0xD"),
          timestamps: {
            latest: 1,
            0: DEFAULT_CONFIG.threshold,
          },
        },
      ];

      setReserves(reserves);
      await initialize();

      const blockEvent = new TestBlockEvent().setNumber(0).setTimestamp(DEFAULT_CONFIG.threshold + 1);

      expect(await handleBlock(blockEvent)).toStrictEqual([]);
      expect(assetsDataList).toStrictEqual(
        reserves.map((reserve) => assetData(reserve.asset, reserve.source, reserve.timestamps[0]))
      );
    });

    it("should return multiple findings if multiple reserve sources are stale", async () => {
      const staleSourceReserves = [
        {
          asset: createAddress("0xA"),
          source: createAddress("0xB"),
          timestamps: {
            latest: 1,
            0: 2,
          },
        },
        {
          asset: createAddress("0xC"),
          source: createAddress("0xD"),
          timestamps: {
            latest: 1,
            0: 2,
          },
        },
      ];

      const nonStaleSourceReserves = [
        {
          asset: createAddress("0xE"),
          source: createAddress("0xF"),
          timestamps: {
            latest: 1,
            0: DEFAULT_CONFIG.threshold,
          },
        },
      ];

      setReserves([...staleSourceReserves, ...nonStaleSourceReserves]);
      await initialize();

      const blockEvent = new TestBlockEvent().setNumber(0).setTimestamp(DEFAULT_CONFIG.threshold + 2);

      expect(await handleBlock(blockEvent)).toStrictEqual(
        staleSourceReserves.map((reserve) =>
          createFinding(assetData(reserve.asset, reserve.source, reserve.timestamps[0]))
        )
      );
      expect(assetsDataList).toStrictEqual([
        ...staleSourceReserves.map((reserve) => assetData(reserve.asset, reserve.source, blockEvent.block.timestamp)),
        ...nonStaleSourceReserves.map((reserve) => assetData(reserve.asset, reserve.source, reserve.timestamps[0])),
      ]);
    });
  });
});
