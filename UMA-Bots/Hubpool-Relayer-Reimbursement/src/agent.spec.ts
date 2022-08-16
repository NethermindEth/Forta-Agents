import { HandleTransaction, TransactionEvent } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import {
  REIMBURSEMENT_EVENT,
  MAINNET_SPOKE_POOL,
  BOBA_SPOKE_POOL,
  POLYGON_SPOKE_POOL,
  ARBITRUM_SPOKE_POOL,
  OPTIMISM_SPOKE_POOL,
  ADAPTER_TO_CHAIN_NAME,
} from "./constants";
import { createAddress, NetworkManager } from "forta-agent-tools";
import  { provideHandleTransaction } from "./agent";
import { createBotFinding } from "./helpers";
import { NetworkDataInterface } from "./network";

const RANDOM_ADDRESSES = [createAddress("0x12"), createAddress("0x68"), createAddress("0x419")];
const NEW_EVENT = "event Paused(bool indexed isPaused)";


const TEST_HUBPOOL_ADDR: string = createAddress("0x01");

const TEST_NM_DATA: Record<number, NetworkDataInterface> = {
  0 : {
    hubPoolAddr: TEST_HUBPOOL_ADDR,
  },
};

describe("Relayer reimbursement detection bot", () => {
  const networkManager = new NetworkManager(TEST_NM_DATA);
  networkManager.setNetwork(0);
  let handleTransaction: HandleTransaction = provideHandleTransaction(REIMBURSEMENT_EVENT, ADAPTER_TO_CHAIN_NAME, networkManager);

  it("returns empty findings if there is no reimbursement", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().setFrom(TEST_HUBPOOL_ADDR);
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
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(REIMBURSEMENT_EVENT, TEST_HUBPOOL_ADDR, [
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
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(NEW_EVENT, TEST_HUBPOOL_ADDR, [true]);
    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("returns a finding if a reimbursement is made on a relevant contract address to Optimism's spoke pool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(REIMBURSEMENT_EVENT, TEST_HUBPOOL_ADDR, [
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
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(REIMBURSEMENT_EVENT, TEST_HUBPOOL_ADDR, [
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
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(REIMBURSEMENT_EVENT, TEST_HUBPOOL_ADDR, [
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
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(REIMBURSEMENT_EVENT, TEST_HUBPOOL_ADDR, [
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
      .addEventLog(REIMBURSEMENT_EVENT, TEST_HUBPOOL_ADDR, [
        RANDOM_ADDRESSES[0],
        RANDOM_ADDRESSES[1],
        "0x1A4",
        POLYGON_SPOKE_POOL,
      ])
      .addEventLog(REIMBURSEMENT_EVENT, TEST_HUBPOOL_ADDR, [
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
      .addEventLog(REIMBURSEMENT_EVENT, TEST_HUBPOOL_ADDR, [
        RANDOM_ADDRESSES[0],
        RANDOM_ADDRESSES[1],
        "0x1A4",
        POLYGON_SPOKE_POOL,
      ])
      .addEventLog(REIMBURSEMENT_EVENT, TEST_HUBPOOL_ADDR, [
        RANDOM_ADDRESSES[0],
        RANDOM_ADDRESSES[1],
        "0x1A4",
        MAINNET_SPOKE_POOL,
      ])
      .addEventLog(NEW_EVENT, TEST_HUBPOOL_ADDR, [true]);

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createBotFinding(RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1], "420", POLYGON_SPOKE_POOL, "Polygon"),
      createBotFinding(RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1], "420", MAINNET_SPOKE_POOL, "Mainnet"),
    ]);
  });
});
