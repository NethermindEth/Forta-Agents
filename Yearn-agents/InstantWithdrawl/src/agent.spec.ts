import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent,
  HandleBlock,
  createBlockEvent,
} from "forta-agent";
import { TestBlockEvent } from "forta-agent-tools";
import agent from "./agent";

describe("high gas agent", () => {
  let handleTransaction: HandleBlock;

  const createTxEventWithGasUsed = (gasUsed: string) =>
    createTransactionEvent({
      transaction: {} as any,
      receipt: { gasUsed } as any,
      block: {} as any,
    });

  beforeAll(async () => {
    const mockWeb3 = {};
    handleTransaction = await agent.providerHandleBlock(mockWeb3 as any);
  });

  describe("handleTransaction", () => {
    it("returns empty findings if gas used is below threshold", async () => {
      const blockEvent = new TestBlockEvent();
      handleTransaction(blockEvent);
    });
  });
});
