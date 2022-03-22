import { FindingType, FindingSeverity, Finding, HandleTransaction, createTransactionEvent } from "forta-agent";
import agent from "./agent";

describe("high gas agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  describe("handleTransaction", () => {});
});
