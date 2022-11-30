import {
  Finding,
  HandleTransaction,
  Trace,
  TransactionEvent,
} from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import agent, { thresholds } from "./agent";
import { createFinding, reentracyLevel } from "./agent.utils";

const createTxEvent = (traces: Trace[]) =>
  new TestTransactionEvent().addTraces(...traces);

describe("Reentrancy counter agent tests suit", () => {
  const handleTransaction: HandleTransaction = agent.handleTransaction;

  describe("handleTransaction", () => {
    it("Should return empty findings if no traces provided", async () => {
      const tx: TestTransactionEvent = new TestTransactionEvent();
      const findings: Finding[] = await handleTransaction(tx);
      expect(findings).toStrictEqual([]);
    });

    it("Should return empty findings if no repetition detected", async () => {
      const tx: TestTransactionEvent = new TestTransactionEvent().addTraces(
        { to: "0x0", traceAddress: [] },
        { to: "0x1", traceAddress: [0] },
        { to: "0x2", traceAddress: [0, 0] },
        { to: "0x3", traceAddress: [0, 0, 0] }
      );
      const findings: Finding[] = await handleTransaction(tx);
      expect(findings).toStrictEqual([]);
    });

    it("Should ignore non reentrant calls", async () => {
      const tx: TestTransactionEvent = new TestTransactionEvent().addTraces(
        { to: "0x0", traceAddress: [] },
        { to: "0x1", traceAddress: [0] },
        { to: "0x1", traceAddress: [1] },
        { to: "0x2", traceAddress: [1, 0] },
        { to: "0x2", traceAddress: [1, 1] },
        { to: "0x2", traceAddress: [1, 2] },
        { to: "0x2", traceAddress: [1, 3] },
        { to: "0x1", traceAddress: [2] },
        { to: "0x1", traceAddress: [3] },
        { to: "0x2", traceAddress: [4] },
        { to: "0x2", traceAddress: [5] },
        { to: "0x1", traceAddress: [6] },
        { to: "0x1", traceAddress: [7] }
      );
      const findings: Finding[] = await handleTransaction(tx);
      expect(findings).toStrictEqual([]);
    });

    it("Should detect different thresholds of reentrancy", async () => {
      // 0x0, 0x1, 0x3, 0x5, 0x6 called less than 3 times
      // 0x2 called 3 times
      // 0x4 called 5 times
      const tx: TestTransactionEvent = new TestTransactionEvent().addTraces(
        { to: "0x0", traceAddress: [] },
        { to: "0x1", traceAddress: [0] },
        { to: "0x2", traceAddress: [0, 0] },
        { to: "0x3", traceAddress: [0, 0, 0] },
        { to: "0x2", traceAddress: [0, 0, 0, 0] },
        { to: "0x3", traceAddress: [0, 0, 0, 0, 0] },
        { to: "0x2", traceAddress: [0, 0, 0, 0, 0, 0] },
        { to: "0x4", traceAddress: [0, 1] },
        { to: "0x5", traceAddress: [0, 1, 0] },
        { to: "0x6", traceAddress: [0, 1, 0, 0] },
        { to: "0x4", traceAddress: [0, 1, 0, 0, 0] },
        { to: "0x5", traceAddress: [0, 1, 0, 0, 0, 0] },
        { to: "0x4", traceAddress: [0, 1, 0, 0, 0, 0, 0] },
        { to: "0x6", traceAddress: [0, 1, 0, 0, 0, 0, 0, 0] },
        { to: "0x4", traceAddress: [0, 1, 0, 0, 0, 0, 0, 0, 0] },
        { to: "0x1", traceAddress: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0] },
        { to: "0x4", traceAddress: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
      );
      const [report0x1, severity0x1] = reentracyLevel(1, thresholds);
      const [report0x2, severity0x2] = reentracyLevel(3, thresholds);
      const [report0x4, severity0x4] = reentracyLevel(5, thresholds);
      const expected: Finding[] = [];
      if (report0x1) expected.push(createFinding("0x1", 1, severity0x1));
      if (report0x2) expected.push(createFinding("0x2", 3, severity0x2));
      if (report0x4) expected.push(createFinding("0x4", 5, severity0x4));

      const findings: Finding[] = await handleTransaction(tx);
      expect(findings).toEqual(expect.arrayContaining(expected));
      expect(findings.length).toEqual(expected.length);
    });
  });
});
