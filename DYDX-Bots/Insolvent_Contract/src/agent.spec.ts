import { FindingType, FindingSeverity, Finding, HandleTransaction, createTransactionEvent, ethers } from "forta-agent";
import agent from "./agent";

describe("high tether transfer agent", () => {
  let handleTransaction: HandleTransaction;
  const mockTxEvent = createTransactionEvent({} as any);

  beforeAll(() => {});

  describe("handleTransaction", () => {});
});
