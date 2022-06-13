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
  ethers,
} from "forta-agent";

import { createAddress } from "forta-agent-tools/lib/tests";
import LENDING_POOL_ABI from "./abi";

import { provideHandleTransaction } from "./agent";
import utils, { AgentConfig } from "./utils";

const createTrace = (stack: number[], to: string, input: string = "0x"): Trace => {
  return {
    traceAddress: stack,
    action: {
      to,
      input,
    } as TraceAction,
  } as Trace;
};

const CONFIG: AgentConfig = {
  reentrancyBlacklist: ["withdraw", "deposit"],
  lendingPoolAddress: createAddress("4001"),
};

const LENDING_POOL_IFACE = new ethers.utils.Interface(LENDING_POOL_ABI);
const irrelevantSig = "0x12345678";
const irrelevantAddress = createAddress("0x1");

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
      const tx: TransactionEvent = createTxEvent([createTrace([], CONFIG.lendingPoolAddress)]);
      const findings: Finding[] = await handleTx(tx);
      expect(findings).toStrictEqual([]);
    });

    it("Should return empty findings if the reentrant call was not related to the LendingPool address", async () => {
      const tx: TransactionEvent = createTxEvent([
        createTrace([], irrelevantAddress),
        createTrace([0], irrelevantAddress),
        createTrace([0, 0], irrelevantAddress, LENDING_POOL_IFACE.getSighash("borrow")),
        createTrace([0, 0, 0], irrelevantAddress),
      ]);
      const findings: Finding[] = await handleTx(tx);
      expect(findings).toStrictEqual([]);
    });

    it("Should return empty findings if no reentrant call from signatures array detected", async () => {
      const tx: TransactionEvent = createTxEvent([
        createTrace([], CONFIG.lendingPoolAddress),
        createTrace([0], CONFIG.lendingPoolAddress, irrelevantSig),
        createTrace([0, 0], CONFIG.lendingPoolAddress, irrelevantSig),
        createTrace([0, 0, 0], CONFIG.lendingPoolAddress, irrelevantSig),
      ]);
      const findings: Finding[] = await handleTx(tx);
      expect(findings).toStrictEqual([]);
    });

    it("Should detect a finding if a blacklisted function is called in a reentrant way", async () => {
      const withdraw = LENDING_POOL_IFACE.encodeFunctionData("withdraw", [
        createAddress("0x0a"),
        234,
        createAddress("0x0b"),
      ]);

      const tx: TransactionEvent = createTxEvent(
        [
          createTrace([], CONFIG.lendingPoolAddress, "0x"),
          createTrace([0], CONFIG.lendingPoolAddress, withdraw), // Reentrant withdraw call
        ],
        "0x"
      );

      const findings: Finding[] = await handleTx(tx);
      expect(findings).toStrictEqual([utils.createFinding("(unknown)", "withdraw")]);
    });

    it("Should return only one finding per subtree that contains a reentrant call", async () => {
      const deposit = LENDING_POOL_IFACE.encodeFunctionData("deposit", [
        createAddress("0x0a"),
        234,
        createAddress("0x0b"),
        0,
      ]);

      const withdraw = LENDING_POOL_IFACE.encodeFunctionData("withdraw", [
        createAddress("0x0a"),
        234,
        createAddress("0x0b"),
      ]);

      const tx: TransactionEvent = createTxEvent(
        [
          createTrace([], CONFIG.lendingPoolAddress, deposit), // Deposit call
          createTrace([0], CONFIG.lendingPoolAddress, withdraw), // Reentrant withdraw call
          createTrace([0, 0], CONFIG.lendingPoolAddress, withdraw), // Reentrant withdraw call
          createTrace([0, 1], CONFIG.lendingPoolAddress, irrelevantSig),
        ],
        deposit
      );

      const findings: Finding[] = await handleTx(tx);
      expect(findings).toStrictEqual([utils.createFinding("deposit", "withdraw")]);
    });

    it("Should handle multiple subtrees with and without reentrant calls", async () => {
      const deposit = LENDING_POOL_IFACE.encodeFunctionData("deposit", [
        createAddress("0x0a"),
        234,
        createAddress("0x0b"),
        0,
      ]);

      const withdraw = LENDING_POOL_IFACE.encodeFunctionData("withdraw", [
        createAddress("0x0a"),
        234,
        createAddress("0x0b"),
      ]);

      const tx: TransactionEvent = createTxEvent(
        [
          createTrace([], irrelevantAddress, irrelevantSig),

          createTrace([0], CONFIG.lendingPoolAddress, deposit), // -> finding
          createTrace([0, 0], CONFIG.lendingPoolAddress, withdraw),

          createTrace([1], CONFIG.lendingPoolAddress, deposit), // -> finding
          createTrace([1, 0], CONFIG.lendingPoolAddress, withdraw),

          createTrace([2], irrelevantAddress, irrelevantSig),
          createTrace([2, 0], irrelevantAddress, irrelevantSig),
          createTrace([2, 0, 0], CONFIG.lendingPoolAddress, withdraw), // -> finding
          createTrace([2, 0, 0, 0], irrelevantAddress, irrelevantSig),
          createTrace([2, 0, 0, 0, 0], irrelevantAddress, irrelevantSig),
          createTrace([2, 0, 0, 0, 0, 1], CONFIG.lendingPoolAddress, withdraw),

          createTrace([3], CONFIG.lendingPoolAddress, irrelevantSig),
          createTrace([3, 0], irrelevantAddress, irrelevantSig),
        ],
        irrelevantSig
      );

      const findings: Finding[] = await handleTx(tx);
      expect(findings).toStrictEqual([
        utils.createFinding("deposit", "withdraw"),
        utils.createFinding("deposit", "withdraw"),
        utils.createFinding("withdraw", "withdraw"),
      ]);
    });
  });
});
