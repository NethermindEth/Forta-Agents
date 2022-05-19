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

import { createAddress } from "forta-agent-tools/lib/tests";

import { handleTransaction } from "./agent";
import utils from "./utils";

const TEST_CONTRACT_ADDRESS = createAddress("0x01");

const createTrace = (stack: number[]): Trace => {
  return {
    traceAddress: stack,
    action: {
      to: TEST_CONTRACT_ADDRESS,
    } as TraceAction,
  } as Trace;
};

// We need to use createTransactionEvent because TestTransactionEvent.addTraces
// Use TraceProps[] as parameters, TraceProps don't have traces address or action properties
const createTxEvent = (traces: Trace[], data = "") =>
  createTransactionEvent({
    transaction: { data } as Transaction,
    receipt: {} as Receipt,
    block: {} as Block,
    traces: traces,
  } as any);

describe("Lending pool reentrancy agent tests suit", () => {
  const handleTx: HandleTransaction = handleTransaction(TEST_CONTRACT_ADDRESS, utils.REENTERANCY_FUNCTIONS_SIGNATURES);

  describe("handleTransaction", () => {
    it("Should return empty findings if no traces provided", async () => {
      const tx: TransactionEvent = createTxEvent([]);
      const findings: Finding[] = await handleTx(tx);
      expect(findings).toStrictEqual([]);
    });

    it("Should return empty findings if no repetition detected", async () => {
      const tx: TransactionEvent = createTxEvent([
        createTrace([]), // 0x0 -- Initial call
        createTrace([0]), //    Calls 0x1
        createTrace([0, 0]), //    Calls 0x2
        createTrace([0, 0, 0]), //    Calls 0x3
      ]);
      const findings: Finding[] = await handleTx(tx);
      expect(findings).toStrictEqual([]);
    });

    it("Should ignore non reentrant calls", async () => {
      const tx: TransactionEvent = createTxEvent([]);
      const findings: Finding[] = await handleTx(tx);
      expect(findings).toStrictEqual([]);
    });

    it("Should detect different thresholds of reentrancy", async () => {
      const testEncodedWithdrawFuncCall: string = utils.FUNCTIONS_INTERFACE.encodeFunctionData("withdraw", [
        createAddress("0x0a"),
        234,
        createAddress("0x0b"),
      ]);

      // 0x0, 0x1, 0x3, 0x5, 0x6 called less than 3 times
      // 0x2 called 3 times
      // 0x4 called 5 times
      const tx: TransactionEvent = createTxEvent(
        [
          createTrace([]), // Initial call
          createTrace([0]), // Call withdraw for the first time
          createTrace([0, 0]), // Call withdraw inside the transaction another two times
        ],
        testEncodedWithdrawFuncCall
      );

      const expected: Finding[] = [];
      expected.push(utils.createFinding("withdraw"));
      expected.push(utils.createFinding("withdraw"));
      expected.push(utils.createFinding("withdraw"));

      const findings: Finding[] = await handleTx(tx);
      expect(findings).toStrictEqual(expected);
    });
  });
});
