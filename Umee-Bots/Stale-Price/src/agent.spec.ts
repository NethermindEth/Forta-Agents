import { HandleTransaction } from "forta-agent";

import { createAddress, MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/tests";

import agent, { provideHandleTransaction } from "./agent";
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
  it("returns three finding if time between latest timestamp and current timestamp more than the threshold", async () => {
    const block = 14717599;
    const currentTimestamp = 1000000;
    const latestTimestamp = currentTimestamp - CONFIG.threshold;

    const sourceAssets = generateSourceAssets(latestTimestamp);

    const expectedFinding = sourceAssets.map((sourceAsset) => {
      return utils.createFinding(sourceAsset);
    });
    const mockTxEvent = new TestTransactionEvent().setBlock(block).setTimestamp(currentTimestamp);
    handleTx = provideHandleTransaction(CONFIG, mockProvider as any, sourceAssets);
    const findings = await handleTx(mockTxEvent);
    expect(findings).toStrictEqual(expectedFinding);
  });
});
