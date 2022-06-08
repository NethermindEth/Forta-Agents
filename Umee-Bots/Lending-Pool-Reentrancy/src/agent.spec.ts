import { Interface } from "@ethersproject/abi";
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

import CONFIG from "./agent.config";
import { provideHandleTransaction } from "./agent";
import utils from "./utils";

const createTrace = (stack: number[], input = ""): Trace => {
  return {
    traceAddress: stack,
    action: {
      to: CONFIG.lendingPoolAddress,
      input,
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
  const handleTx: HandleTransaction = provideHandleTransaction(CONFIG);

  describe("handleTransaction", () => {
    it("Should return empty findings if no traces provided", async () => {
      const tx: TransactionEvent = createTxEvent([]);
      const findings: Finding[] = await handleTx(tx);
      expect(findings).toStrictEqual([]);
    });

    it("Should return empty findings if no reentrant call from signatures array detected", async () => {
      const tx: TransactionEvent = createTxEvent([
        createTrace([]),
        createTrace([0]),
        createTrace([0, 0]),
        createTrace([0, 0, 0]),
      ]);
      const findings: Finding[] = await handleTx(tx);
      expect(findings).toStrictEqual([]);
    });

    it("Should ignore non reentrant calls", async () => {
      const tx: TransactionEvent = createTxEvent([]);
      const findings: Finding[] = await handleTx(tx);
      expect(findings).toStrictEqual([]);
    });

    it("Should detect a finding if deposit then withdraw in a reentrant way", async () => {
      const iFace = new Interface([
        "function withdraw(address asset,uint256 amount,address to)",
        "function deposit(address asset,uint256 amount,address onBehalfOf,uint16 referralCode)",
      ]);

      const testEncodedDepositFuncCall: string = iFace.encodeFunctionData("deposit", [
        createAddress("0x0a"),
        234,
        createAddress("0x0b"),
        0,
      ]);
      const sighashes = utils.getSigHashes(CONFIG.reentrancyBlacklist);
      const depositSig = sighashes[3];
      const withdrawSig = sighashes[1];
      const tx: TransactionEvent = createTxEvent(
        [
          createTrace([], depositSig), // Deposit call
          createTrace([0], withdrawSig), // Reentrant withdraw call
        ],
        testEncodedDepositFuncCall
      );

      const expected: Finding[] = [];
      expected.push(utils.createFinding(testEncodedDepositFuncCall.slice(0, 10), sighashes[1]));

      const findings: Finding[] = await handleTx(tx);
      expect(findings).toStrictEqual(expected);
    });

    it("Should detect three finding if deposit,withdraw,deposit,any call, deposit.... any calls then withdraw in a reentrant way", async () => {
      const iFace = new Interface([
        "function withdraw(address asset,uint256 amount,address to)",
        "function deposit(address asset,uint256 amount,address onBehalfOf,uint16 referralCode)",
      ]);


      const testEncodedDepositFuncCall: string = iFace.encodeFunctionData("deposit", [
        createAddress("0x0a"),
        234,
        createAddress("0x0b"),
        0,
      ]);
      const sighashes = utils.getSigHashes(CONFIG.reentrancyBlacklist);
      const depositSig = sighashes[3];
      const withdrawSig = sighashes[1];

      const tx: TransactionEvent = createTxEvent(
        [
          createTrace([], depositSig), // Deposit call
          createTrace([0], withdrawSig), // Reentrant withdraw call
          createTrace([0, 0], depositSig), // Reentrant deposit call
          createTrace([0, 0, 0], "0x01234567"), // Any call
          createTrace([0, 0, 0, 0], depositSig), // Reentrant deposit call
        ],
        testEncodedDepositFuncCall
      );

      const expected: Finding[] = [];
      expected.push(utils.createFinding(testEncodedDepositFuncCall.slice(0, 10), sighashes[1]));
      expected.push(utils.createFinding(sighashes[3], testEncodedDepositFuncCall.slice(0, 10)));
      expected.push(utils.createFinding(sighashes[3], testEncodedDepositFuncCall.slice(0, 10)));
      expected.push(utils.createFinding(testEncodedDepositFuncCall.slice(0, 10), sighashes[3]));

      const findings: Finding[] = await handleTx(tx);
      expect(findings).toStrictEqual(expected);
    });
  });
});
