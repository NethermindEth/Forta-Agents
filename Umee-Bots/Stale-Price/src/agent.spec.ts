import { TestBlockEvent } from "forta-agent-tools/lib/tests.utils";
import { HandleBlock, HandleTransaction } from "forta-agent";

import { createAddress, MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/tests";

import agent, { provideHandleTransaction, provideHandleBlock, provideInitialize } from "./agent";
import CONFIG from "./agent.config";
import utils from "./utils";

const generateSourceAssets = (referenceTimestamp: number) => {
  const assetDataAddresses = [createAddress("0x01"), createAddress("0x02"), createAddress("0x03")];
  return [
    {
      source: assetDataAddresses[0],
      asset: assetDataAddresses[1],
      referenceTimestamp,
    },
    {
      source: assetDataAddresses[1],
      asset: assetDataAddresses[2],
      referenceTimestamp,
    },
    {
      source: assetDataAddresses[2],
      asset: assetDataAddresses[0],
      referenceTimestamp,
    },
  ];
};

describe("Lending pool reentrancy agent tests suit", () => {
  let handleTx: HandleTransaction;
  let handleBlock: HandleBlock;
  const mockProvider = new MockEthersProvider();

  beforeEach(() => {
    handleTx = agent.handleTransaction;
  });
  it("returns empty finding if time between latest timestamp and current timestamp is less than the threshold", async () => {
    const block = 14717599;
    const currentTimestamp = 1000000;
    const lastUpdatedAt = currentTimestamp - 10;

    const assetData = generateSourceAssets(lastUpdatedAt);

    const mockTxEvent = new TestTransactionEvent().setBlock(block).setTimestamp(currentTimestamp);

    handleTx = provideHandleTransaction(CONFIG, mockProvider as any, assetData);
    const findings = await handleTx(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });
  it("return a finding if the initialized assetData has a staled price", async () => {
    const block = 14717599;
    const currentTimestamp = 1000000;
    const lastUpdatedAt = currentTimestamp - CONFIG.threshold;
    const expectedAssetData = {
      asset: createAddress("0x08"),
      source: createAddress("0x08"),
      referenceTimestamp: lastUpdatedAt,
    };
    mockProvider.addCallTo(CONFIG.lendingPoolAddress, block, utils.FUNCTIONS_INTERFACE, "getReservesList", {
      inputs: [],
      outputs: [[expectedAssetData.asset]],
    });
    mockProvider.addCallTo(CONFIG.umeeOracleAddress, block, utils.FUNCTIONS_INTERFACE, "getSourceOfAsset", {
      inputs: [expectedAssetData.asset],
      outputs: [expectedAssetData.source],
    });
    mockProvider.addCallTo(expectedAssetData.source, block, utils.FUNCTIONS_INTERFACE, "latestTimestamp", {
      inputs: [],
      outputs: [lastUpdatedAt],
    });

    mockProvider.setLatestBlock(block);

    // Test initialize
    const assetData = await utils.getAssetData(CONFIG, mockProvider as any);
    expect(assetData).toStrictEqual([expectedAssetData]);

    const mockTxBlock = new TestBlockEvent().setNumber(block).setTimestamp(currentTimestamp);
    handleBlock = provideHandleBlock(CONFIG, mockProvider as any, assetData);
    const findings = await handleBlock(mockTxBlock);

    expect(findings).toStrictEqual([utils.createFinding(expectedAssetData)]);
  });
  it("returns a finding if a new asset have been added with staled price", async () => {
    const block = 14717599;
    const currentTimestamp = 1000000;
    const lastUpdatedAt = currentTimestamp - CONFIG.threshold;
    const assetData = {
      source: createAddress("0x09"),
      asset: createAddress("0x08"),
      referenceTimestamp: lastUpdatedAt,
    };
    const event = utils.FUNCTIONS_INTERFACE.getEvent("AssetSourceUpdated");
    const log = utils.FUNCTIONS_INTERFACE.encodeEventLog(event, [assetData.asset, assetData.source]);
    const mockTxEvent = new TestTransactionEvent()
      .setBlock(block)
      .setTimestamp(currentTimestamp)
      .addAnonymousEventLog(CONFIG.umeeOracleAddress, log.data, ...log.topics);

    mockProvider.addCallTo(assetData.source, block, utils.FUNCTIONS_INTERFACE, "latestTimestamp", {
      inputs: [],
      outputs: [lastUpdatedAt],
    });

    mockProvider.setLatestBlock(block);

    const expectedFinding = [utils.createFinding(assetData)];

    handleTx = provideHandleTransaction(CONFIG, mockProvider as any, [assetData]);
    const findings = await handleTx(mockTxEvent);
    expect(findings).toStrictEqual(expectedFinding);
  });

  it("returns three finding if time between latest timestamp and current timestamp more than the threshold", async () => {
    const block = 14717599;
    const currentTimestamp = 1000000;
    const lastUpdatedAt = currentTimestamp - CONFIG.threshold;

    const assetData = generateSourceAssets(lastUpdatedAt);

    const expectedFinding = assetData.map((assetData) => {
      return utils.createFinding(assetData);
    });

    for (let index = 0; index < assetData.length; index++) {
      mockProvider.addCallTo(assetData[index].source, block, utils.FUNCTIONS_INTERFACE, "latestTimestamp", {
        inputs: [],
        outputs: [lastUpdatedAt],
      });
    }

    const mockTxBlock = new TestBlockEvent().setNumber(block).setTimestamp(currentTimestamp);
    handleBlock = provideHandleBlock(CONFIG, mockProvider as any, assetData);
    const findings = await handleBlock(mockTxBlock);
    expect(findings).toStrictEqual(expectedFinding);
  });
});
