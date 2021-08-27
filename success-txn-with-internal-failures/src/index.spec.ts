import {
  TransactionEvent,
  Finding,
  HandleTransaction,
  Trace,
  Receipt,
} from "forta-agent"
import agent, { createFinding } from ".";

interface TraceInfo{
  status: boolean,
  errors: string[],
};

const createTxEvent  = (data: TraceInfo) : TransactionEvent => {
  const traces: Trace[] = data.errors.map((error: string) => {
    return {
      error,
    } as Trace;
  });
  const txn: TransactionEvent = { 
    receipt: { status: data.status } as Receipt, 
    traces 
  } as TransactionEvent;
  return txn;
};

describe("Success txn with internal failures agent test suit", () => {
  const handleTransaction: HandleTransaction = agent.handleTransaction;

  describe("handleTransaction", () => {
    it("Should returns empty findings if not reverted traces are found", async () => {
      const tx: TransactionEvent = createTxEvent({
        status: true,
        errors: ["None"],
      }) 
      const findings: Finding[] = await handleTransaction(tx);
      expect(findings).toStrictEqual([]);
    });

    it("Should ignore reverted transactions", async () => {
      const tx: TransactionEvent = createTxEvent({
        status: false,
        errors: ["Reverted"],
      }) 
      const findings: Finding[] = await handleTransaction(tx);
      expect(findings).toStrictEqual([]);
    });

    it("Should report the number of internal transactions failures", async () => {
      const tx: TransactionEvent = createTxEvent({
        status: true,
        errors: ["Reverted", "Reverted", "None","Reverted"],
      }) 
      const findings: Finding[] = await handleTransaction(tx);
      expect(findings).toStrictEqual([
        createFinding(3),
      ]);
    });

  });
});
