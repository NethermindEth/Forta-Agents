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

import agent, { initialize, provideHandleTransaction } from "./agent";
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
  const mockProvider: MockEthersProvider = new MockEthersProvider();

  beforeAll(() => {
    handleTx = agent.handleTransaction;
  });
  beforeEach(() => mockProvider.clear());
  it("returns empty finding if latesttimestamp is less than the threshold", async () => {
    const block = 14717599;
    const outputs = [createAddress("0x01"), createAddress("0x02"), createAddress("0x03")];
    const currentTimestamp = 1000000;
    const latestTimestamp = currentTimestamp - 10;
    mockProvider.addCallTo(CONFIG.lendingPoolAddress, block, utils.FUNCTIONS_INTERFACE, "getReservesList", {
      inputs: [],
      outputs: [outputs],
    });

    mockProvider.addCallTo(CONFIG.umeeOracleAddress, block, utils.FUNCTIONS_INTERFACE, "getSourceOfAsset", {
      inputs: [outputs[0]],
      outputs: [outputs[0]],
    });
    mockProvider.addCallTo(CONFIG.umeeOracleAddress, block, utils.FUNCTIONS_INTERFACE, "getSourceOfAsset", {
      inputs: [outputs[1]],
      outputs: [outputs[1]],
    });
    mockProvider.addCallTo(CONFIG.umeeOracleAddress, block, utils.FUNCTIONS_INTERFACE, "getSourceOfAsset", {
      inputs: [outputs[2]],
      outputs: [outputs[2]],
    });

    mockProvider.addCallTo(outputs[0], block, utils.FUNCTIONS_INTERFACE, "latestTimestamp", {
      inputs: [],
      outputs: [latestTimestamp],
    });
    mockProvider.addCallTo(outputs[1], block, utils.FUNCTIONS_INTERFACE, "latestTimestamp", {
      inputs: [],
      outputs: [latestTimestamp],
    });
    mockProvider.addCallTo(outputs[2], block, utils.FUNCTIONS_INTERFACE, "latestTimestamp", {
      inputs: [],
      outputs: [latestTimestamp],
    });
    await initialize(mockProvider as any);
    const mockTxEvent = new TestTransactionEvent().setBlock(block);
    const findings = await handleTx(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });
});
