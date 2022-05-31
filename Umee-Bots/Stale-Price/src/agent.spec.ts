import { TestBlockEvent } from "forta-agent-tools/lib/tests.utils";
import { HandleBlock, HandleTransaction } from "forta-agent";

import { createAddress, MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/tests";

import agent, { provideHandleTransaction, provideHandleBlock } from "./agent";
import CONFIG from "./agent.config";
import utils from "./utils";

const generateSourceAssets = (latestTimestamp: number) => {
  const sourceAssetAddresses = [createAddress("0x01"), createAddress("0x02"), createAddress("0x03")];
  return [
    {
      source: sourceAssetAddresses[0],
      asset: sourceAssetAddresses[1],
      latestTimestamp,
    },
    {
      source: sourceAssetAddresses[1],
      asset: sourceAssetAddresses[2],
      latestTimestamp,
    },
    {
      source: sourceAssetAddresses[2],
      asset: sourceAssetAddresses[0],
      latestTimestamp,
    },
  ];
};

describe("Lending pool reentrancy agent tests suit", () => {
  let handleTx: HandleTransaction;
  let handleBlock: HandleBlock;
  const mockProvider = new MockEthersProvider();

  beforeAll(() => {
    handleTx = agent.handleTransaction;
  });
  it("returns empty finding if time between latest timestamp and current timestamp is less than the threshold", async () => {
    const block = 14717599;
    const currentTimestamp = 1000000;
    const latestTimestamp = currentTimestamp - 10;

    const sourceAssets = generateSourceAssets(latestTimestamp);

    const mockTxEvent = new TestTransactionEvent().setBlock(block).setTimestamp(currentTimestamp);

    handleTx = provideHandleTransaction(CONFIG, mockProvider as any, sourceAssets);
    const findings = await handleTx(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns a finding if a new asset have been added with staled price", async () => {
    const block = 14717599;
    const currentTimestamp = 1000000;
    const latestTimestamp = currentTimestamp - CONFIG.threshold;
    const sourceAsset = {
      source: createAddress("0x09"),
      asset: createAddress("0x08"),
      latestTimestamp,
    };
    const event = utils.FUNCTIONS_INTERFACE.getEvent("AssetSourceUpdated");

    const log = utils.FUNCTIONS_INTERFACE.encodeEventLog(event, [sourceAsset.asset, sourceAsset.source]);

    const mockTxEvent = new TestTransactionEvent()
      .setBlock(block)
      .setTimestamp(currentTimestamp)
      .addAnonymousEventLog(CONFIG.umeeOracleAddress, log.data, ...log.topics);

    mockProvider.addCallTo(sourceAsset.source, block, utils.FUNCTIONS_INTERFACE, "latestTimestamp", {
      inputs: [],
      outputs: [latestTimestamp],
    });

    mockProvider.setLatestBlock(block);

    const expectedFinding = [utils.createFinding(sourceAsset)];

    handleTx = provideHandleTransaction(CONFIG, mockProvider as any, [sourceAsset]);
    const findings = await handleTx(mockTxEvent);
    expect(findings).toStrictEqual(expectedFinding);
  });

  it("returns three finding if time between latest timestamp and current timestamp more than the threshold", async () => {
    const block = 14717599;
    const currentTimestamp = 1000000;
    const latestTimestamp = currentTimestamp - CONFIG.threshold;

    const sourceAssets = generateSourceAssets(latestTimestamp);

    const expectedFinding = sourceAssets.map((sourceAsset) => {
      return utils.createFinding(sourceAsset);
    });
    const mockTxBlock = new TestBlockEvent().setNumber(block).setTimestamp(currentTimestamp);
    handleBlock = provideHandleBlock(CONFIG, mockProvider as any, sourceAssets);
    const findings = await handleBlock(mockTxBlock);
    expect(findings).toStrictEqual(expectedFinding);
  });
});
