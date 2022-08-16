import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import {
  REIMBURSEMENT_EVENT,
  HUBPOOL_ADDRESS,
  MAINNET_SPOKE_POOL,
  BOBA_SPOKE_POOL,
  POLYGON_SPOKE_POOL,
  ARBITRUM_SPOKE_POOL,
  OPTIMISM_SPOKE_POOL,
} from "./constants";
import { createAddress } from "forta-agent-tools";
import agent from "./agent";
import { createBotFinding } from "./helpers";

const RANDOM_ADDRESSES = [createAddress("0x12"), createAddress("0x68"), createAddress("0x419")];
const NEW_EVENT = "event Paused(bool indexed isPaused)";

describe("Relayer reimbursement detection bot", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  it("returns empty findings if there is no reimbursement", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().setFrom(HUBPOOL_ADDRESS);
    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("returns empty findings if there a reimbursement is made from another contract", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[0])
      .addEventLog(REIMBURSEMENT_EVENT, RANDOM_ADDRESSES[0], [
        RANDOM_ADDRESSES[0],
        RANDOM_ADDRESSES[1],
        "0x123",
        RANDOM_ADDRESSES[2],
      ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("returns a finding if a reimbursement is made on a relevant contract address to Arbitrum spoke pool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(REIMBURSEMENT_EVENT, HUBPOOL_ADDRESS, [
      RANDOM_ADDRESSES[0],
      RANDOM_ADDRESSES[1],
      "0x1A4",
      ARBITRUM_SPOKE_POOL,
    ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createBotFinding(RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1], "420", ARBITRUM_SPOKE_POOL, "Arbitrum"),
    ]);
  });

  it("returns empty findings for other events emitted from target contract", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(NEW_EVENT, HUBPOOL_ADDRESS, [true]);
    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("returns a finding if a reimbursement is made on a relevant contract address to Optimism's spoke pool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(REIMBURSEMENT_EVENT, HUBPOOL_ADDRESS, [
      RANDOM_ADDRESSES[0],
      RANDOM_ADDRESSES[1],
      "0x1A4",
      OPTIMISM_SPOKE_POOL,
    ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createBotFinding(RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1], "420", OPTIMISM_SPOKE_POOL, "Optimism"),
    ]);
  });

  it("returns a finding if a reimbursement is made on a relevant contract address to Boba's spoke pool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(REIMBURSEMENT_EVENT, HUBPOOL_ADDRESS, [
      RANDOM_ADDRESSES[0],
      RANDOM_ADDRESSES[1],
      "0x1A4",
      BOBA_SPOKE_POOL,
    ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createBotFinding(RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1], "420", BOBA_SPOKE_POOL, "Boba"),
    ]);
  });

  it("returns a finding if a reimbursement is made on a relevant contract address to Mainnet's spoke pool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(REIMBURSEMENT_EVENT, HUBPOOL_ADDRESS, [
      RANDOM_ADDRESSES[0],
      RANDOM_ADDRESSES[1],
      "0x1A4",
      MAINNET_SPOKE_POOL,
    ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createBotFinding(RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1], "420", MAINNET_SPOKE_POOL, "Mainnet"),
    ]);
  });

  it("returns a finding if a reimbursement is made on a relevant contract address to Polygon's spoke pool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(REIMBURSEMENT_EVENT, HUBPOOL_ADDRESS, [
      RANDOM_ADDRESSES[0],
      RANDOM_ADDRESSES[1],
      "0x1A4",
      POLYGON_SPOKE_POOL,
    ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createBotFinding(RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1], "420", POLYGON_SPOKE_POOL, "Polygon"),
    ]);
  });

  it("returns N (N > 1) findings for N (N > 1) reimbursements in a single txn", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(REIMBURSEMENT_EVENT, HUBPOOL_ADDRESS, [
        RANDOM_ADDRESSES[0],
        RANDOM_ADDRESSES[1],
        "0x1A4",
        POLYGON_SPOKE_POOL,
      ])
      .addEventLog(REIMBURSEMENT_EVENT, HUBPOOL_ADDRESS, [
        RANDOM_ADDRESSES[0],
        RANDOM_ADDRESSES[1],
        "0x1A4",
        MAINNET_SPOKE_POOL,
      ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createBotFinding(RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1], "420", POLYGON_SPOKE_POOL, "Polygon"),
      createBotFinding(RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1], "420", MAINNET_SPOKE_POOL, "Mainnet"),
    ]);
  });

  it("returns only relevant findings when one transaction includes a couple of relevant events and an irrelevant events together", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(REIMBURSEMENT_EVENT, HUBPOOL_ADDRESS, [
        RANDOM_ADDRESSES[0],
        RANDOM_ADDRESSES[1],
        "0x1A4",
        POLYGON_SPOKE_POOL,
      ])
      .addEventLog(REIMBURSEMENT_EVENT, HUBPOOL_ADDRESS, [
        RANDOM_ADDRESSES[0],
        RANDOM_ADDRESSES[1],
        "0x1A4",
        MAINNET_SPOKE_POOL,
      ])
      .addEventLog(NEW_EVENT, HUBPOOL_ADDRESS, [true]);

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createBotFinding(RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1], "420", POLYGON_SPOKE_POOL, "Polygon"),
      createBotFinding(RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1], "420", MAINNET_SPOKE_POOL, "Mainnet"),
    ]);
  });
});
