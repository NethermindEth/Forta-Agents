import {
  Finding,
  HandleTransaction,
  createTransactionEvent,
  Trace,
  Transaction,
  Receipt,
  Block,
  TransactionEvent,
  TraceAction,
} from "forta-agent";
import agent from "./agent";
import { createFinding, reentracyLevel } from "./agent.utils";

const createTrace = (to: string, stack: number[]): Trace => {
  return {
    traceAddress: stack,
    action: {
      to: to,
    } as TraceAction,
  } as Trace;
};

const createTxEvent = (traces: Trace[]) =>
  createTransactionEvent({
    transaction: {} as Transaction,
    receipt: {} as Receipt,
    block: {} as Block,
    traces: traces,
  });


describe("Reentrancy counter agent tests suit", () => {
  const handleTransaction: HandleTransaction = agent.handleTransaction;

  describe("handleTransaction", () => {
    it("Should return empty findinds if no traces provided", async () => {
      const tx: TransactionEvent = createTxEvent([]);
      const findings: Finding[] = await handleTransaction(tx);
      expect(findings).toStrictEqual([]);
    });

    it("Should return empty findinds if no repetition detected", async () => {
      const tx: TransactionEvent = createTxEvent([
        createTrace("0x0", []),         // 0x0 -- Initial call
        createTrace("0x1", [0]),        //    Calls 0x1
        createTrace("0x2", [0, 0]),     //    Calls 0x2
        createTrace("0x3", [0, 0, 0]),  //    Calls 0x3
      ]);
      const findings: Finding[] = await handleTransaction(tx);
      expect(findings).toStrictEqual([]);
    });

    it("Should ignore non reentrant calls", async () => {
      const tx: TransactionEvent = createTxEvent([
        createTrace("0x0", []),      // 0x0 -- Initial call
        createTrace("0x1", [0]),     //    Calls 0x1 
        createTrace("0x1", [1]),     //    Calls 0x1
        createTrace("0x2", [1, 0]),  //       Calls 0x2
        createTrace("0x2", [1, 1]),  //       Calls 0x2
        createTrace("0x2", [1, 2]),  //       Calls 0x2
        createTrace("0x2", [1, 3]),  //       Calls 0x2
        createTrace("0x1", [2]),     //    Calls 0x1
        createTrace("0x1", [3]),     //    Calls 0x1
        createTrace("0x2", [4]),     //    Calls 0x2
        createTrace("0x3", [5]),     //    Calls 0x3
        createTrace("0x1", [6]),     //    Calls 0x1
        createTrace("0x1", [7]),     //    Calls 0x1
      ]);
      const findings: Finding[] = await handleTransaction(tx);
      expect(findings).toStrictEqual([]);
    });

    it("Should detect different levels of reentrancy", async () => {
      // 0x0, 0x1, 0x3, 0x5, 0x6 called less than 3 times
      // 0x2 called 3 times
      // 0x4 called 5 times
      const tx: TransactionEvent = createTxEvent([
        createTrace("0x0", []),                                // 0x0 -- Initial call
        createTrace("0x1", [0]),                               //    Calls 0x1
        createTrace("0x2", [0, 0]),                            //      Calls 0x2
        createTrace("0x3", [0, 0, 0]),                         //        Calls 0x3
        createTrace("0x2", [0, 0, 0, 0]),                      //          Calls 0x2
        createTrace("0x3", [0, 0, 0, 0, 0]),                   //            Calls 0x3
        createTrace("0x2", [0, 0, 0, 0, 0, 0]),                //              Calls 0x2
        createTrace("0x4", [0, 1]),                            //       Calls 0x4
        createTrace("0x5", [0, 1, 0]),                         //         Calls 0x5
        createTrace("0x6", [0, 1, 0, 0]),                      //           Calls 0x6
        createTrace("0x4", [0, 1, 0, 0, 0]),                   //             Calls 0x4
        createTrace("0x5", [0, 1, 0, 0, 0, 0]),                //               Calls 0x5
        createTrace("0x4", [0, 1, 0, 0, 0, 0, 0]),             //                 Calls 0x4
        createTrace("0x6", [0, 1, 0, 0, 0, 0, 0, 0]),          //                   Calls 0x6
        createTrace("0x4", [0, 1, 0, 0, 0, 0, 0, 0, 0]),       //                     Calls 0x4
        createTrace("0x1", [0, 1, 0, 0, 0, 0, 0, 0, 0, 0]),    //                       Calls 0x1
        createTrace("0x4", [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]), //                         Calls 0x4       
      ]);
      const [report0x1, severity0x1] = reentracyLevel(1);
      const [report0x2, severity0x2] = reentracyLevel(3);
      const [report0x4, severity0x4] = reentracyLevel(5);
      const expected: Finding[] = [];
      if(report0x1) 
        expected.push(createFinding("0x1", 1, severity0x1))
      if(report0x2) 
        expected.push(createFinding("0x2", 3, severity0x2))
      if(report0x4) 
        expected.push(createFinding("0x4", 5, severity0x4))

      const findings: Finding[] = await handleTransaction(tx);
      expect(findings).toEqual(expect.arrayContaining(expected));
      expect(findings.length).toEqual(expected.length);
    });
  });
});
