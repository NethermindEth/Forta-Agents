import {
  Finding,
  HandleTransaction,
  Trace,
  TransactionEvent,
  TraceAction,
  createTransactionEvent,
  Block,
  Receipt,
  Transaction,
} from "forta-agent";

import { createAddress, MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/tests";

import agent, { provideHandleTransaction } from "./agent";
import CONFIG from "./agent.config";
import utils from "./utils";

const generateSourceAsset = (
  provider: MockEthersProvider,
  assets: string[],
  sources: string[],
  blockNumber: number
) => {};

describe("Lending pool reentrancy agent tests suit", () => {
  let handleTx: HandleTransaction;

  beforeAll(() => {
    handleTx = agent.handleTransaction;
  });
  it("returns empty finding if time between latest timestamp and current timestamp is less than the threshold", async () => {
    const block = 14717599;
    const sourceAssetAddresses = [createAddress("0x01"), createAddress("0x02"), createAddress("0x03")];
    const currentTimestamp = 1000000;
    const lastTimestamp = currentTimestamp - 10;
    const sourceAssets = [
      {
        source: sourceAssetAddresses[0],
        asset: sourceAssetAddresses[1],
        lastTimestamp,
      },
      {
        source: sourceAssetAddresses[1],
        asset: sourceAssetAddresses[2],
        lastTimestamp,
      },
      {
        source: sourceAssetAddresses[2],
        asset: sourceAssetAddresses[0],
        lastTimestamp,
      },
    ];
    const mockTxEvent = new TestTransactionEvent().setBlock(block).setTimestamp(currentTimestamp);

    handleTx = provideHandleTransaction(CONFIG, sourceAssets);
    const findings = await handleTx(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });
  it("returns three finding if time between latest timestamp and current timestamp more than the threshold", async () => {
    const block = 14717599;
    const sourceAssetAddresses = [createAddress("0x01"), createAddress("0x02"), createAddress("0x03")];
    const currentTimestamp = 1000000;
    const lastTimestamp = currentTimestamp - CONFIG.threshold;

    const sourceAssets = [
      {
        source: sourceAssetAddresses[0],
        asset: sourceAssetAddresses[1],
        lastTimestamp,
      },
      {
        source: sourceAssetAddresses[1],
        asset: sourceAssetAddresses[2],
        lastTimestamp,
      },
      {
        source: sourceAssetAddresses[2],
        asset: sourceAssetAddresses[0],
        lastTimestamp,
      },
    ];
    const expectedFinding = sourceAssets.map((sourceAsset) => {
      return utils.createFinding(sourceAsset);
    });
    const mockTxEvent = new TestTransactionEvent().setBlock(block).setTimestamp(currentTimestamp);
    handleTx = provideHandleTransaction(CONFIG, sourceAssets);
    const findings = await handleTx(mockTxEvent);
    expect(findings).toStrictEqual(expectedFinding);
  });
});
