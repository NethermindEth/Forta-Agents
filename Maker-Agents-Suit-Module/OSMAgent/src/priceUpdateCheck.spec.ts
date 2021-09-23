import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent,
} from "forta-agent";
import agent from "./priceUpdateCheck";

describe("high gas agent", () => {
  let handleTransaction: HandleTransaction;

  const createTxEventWithGasUsed = (gasUsed: string) =>
    createTransactionEvent({
      transaction: {} as any,
      receipt: { gasUsed } as any,
      block: {} as any,
    });

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  describe("handleTransaction", () => {});
});
