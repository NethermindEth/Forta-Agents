import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction
} from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";

import agent, { DECIMALS, TX_VALUE_THRESHOLD } from "./agent";

describe("Detect Very High Txn Value", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  describe("Handle Transaction", () => {
    it("returns empty findings if value is below threshold", async () => {
      const txEvent = new TestTransactionEvent();

      txEvent.setValue(`${1 * DECIMALS}`);
      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if value is equal to threshold", async () => {
      const txEvent = new TestTransactionEvent();

      txEvent.setValue(`${TX_VALUE_THRESHOLD}`);

      const findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("returns a findings if value is above threshold", async () => {
      const txEvent = new TestTransactionEvent();
      const value = 101 * DECIMALS;

      txEvent.setValue(`${value}`);

      const findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "High Value Use Detection",
          description: "High value is used.",
          alertId: "NETHFORTA-2",
          severity: FindingSeverity.High,
          type: FindingType.Suspicious,
          metadata: {
            value: value.toString()
          }
        })
      ]);
    });
  });
});
