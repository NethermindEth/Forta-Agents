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

  describe("No response if different protocol", () => {});
  describe("Time < 10min, nothing returned, first time function call", () => {});
  describe("getStatus after time has lasped > 10 min and the status is still false", () => {});
  describe("getStatus after time has lasped < 10 min and the status is true, should return a critical shoutout", () => {});
});
