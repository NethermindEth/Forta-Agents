import { HandleTransaction, TransactionEvent } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import {
  REIMBURSEMENT_EVENT,
} from "./constants";
import { createAddress, NetworkManager } from "forta-agent-tools";
import { provideHandleTransaction } from "./agent";
import { createBotFinding } from "./helpers";
import { NetworkDataInterface } from "./network";

const RANDOM_ADDRESSES = [createAddress("0x12"), createAddress("0x68"), createAddress("0x419")];
const NEW_EVENT = "event Paused(bool indexed isPaused)";
const MOCK_MAINNET_SPOKE_POOL : string = createAddress("0x91");
const MOCK_OPTIMISM_SPOKE_POOL : string = createAddress("0x92");
const MOCK_POLYGON_SPOKE_POOL = createAddress("0x93");
const MOCK_BOBA_SPOKE_POOL = createAddress("0x94");
const MOCK_ARBITRUM_SPOKE_POOL = createAddress("0x95");
const MOCK_ADAPTER_TO_CHAIN_NAME : {[key: string]: string} = {
  [MOCK_MAINNET_SPOKE_POOL] : "Mainnet",
  [MOCK_OPTIMISM_SPOKE_POOL] : "Optimism",
  [MOCK_POLYGON_SPOKE_POOL] : "Polygon",
  [MOCK_BOBA_SPOKE_POOL] : "Boba",
  [MOCK_ARBITRUM_SPOKE_POOL] : "Arbitrum",
};

const TEST_HUBPOOL_ADDR: string = createAddress("0x01");

const TEST_NM_DATA: Record<number, NetworkDataInterface> = {
  0: {
    hubPoolAddr: TEST_HUBPOOL_ADDR,
  },
};

describe("Relayer reimbursement detection bot", () => {
  const networkManager = new NetworkManager(TEST_NM_DATA, 0);
  let handleTransaction: HandleTransaction = provideHandleTransaction(
    REIMBURSEMENT_EVENT,
    MOCK_ADAPTER_TO_CHAIN_NAME,
    networkManager
  );

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
      MOCK_ARBITRUM_SPOKE_POOL,
    ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createBotFinding(RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1], "420", MOCK_ARBITRUM_SPOKE_POOL, "Arbitrum"),
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
      MOCK_OPTIMISM_SPOKE_POOL,
    ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createBotFinding(RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1], "420", MOCK_OPTIMISM_SPOKE_POOL, "Optimism"),
    ]);
  });

  it("returns a finding if a reimbursement is made on a relevant contract address to Boba's spoke pool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(REIMBURSEMENT_EVENT, TEST_HUBPOOL_ADDR, [
      RANDOM_ADDRESSES[0],
      RANDOM_ADDRESSES[1],
      "0x1A4",
      MOCK_BOBA_SPOKE_POOL,
    ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createBotFinding(RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1], "420", MOCK_BOBA_SPOKE_POOL, "Boba"),
    ]);
  });

  it("returns a finding if a reimbursement is made on a relevant contract address to Mainnet's spoke pool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(REIMBURSEMENT_EVENT, TEST_HUBPOOL_ADDR, [
      RANDOM_ADDRESSES[0],
      RANDOM_ADDRESSES[1],
      "0x1A4",
      MOCK_MAINNET_SPOKE_POOL,
    ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createBotFinding(RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1], "420", MOCK_MAINNET_SPOKE_POOL, "Mainnet"),
    ]);
  });

  it("returns a finding if a reimbursement is made on a relevant contract address to Polygon's spoke pool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(REIMBURSEMENT_EVENT, TEST_HUBPOOL_ADDR, [
      RANDOM_ADDRESSES[0],
      RANDOM_ADDRESSES[1],
      "0x1A4",
      MOCK_POLYGON_SPOKE_POOL,
    ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createBotFinding(RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1], "420", MOCK_POLYGON_SPOKE_POOL, "Polygon"),
    ]);
  });

  it("returns N (N > 1) findings for N (N > 1) reimbursements in a single txn", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(REIMBURSEMENT_EVENT, TEST_HUBPOOL_ADDR, [
        RANDOM_ADDRESSES[0],
        RANDOM_ADDRESSES[1],
        "0x1A4",
        MOCK_POLYGON_SPOKE_POOL,
      ])
      .addEventLog(REIMBURSEMENT_EVENT, TEST_HUBPOOL_ADDR, [
        RANDOM_ADDRESSES[0],
        RANDOM_ADDRESSES[1],
        "0x1A4",
        MOCK_MAINNET_SPOKE_POOL,
      ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createBotFinding(RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1], "420", MOCK_POLYGON_SPOKE_POOL, "Polygon"),
      createBotFinding(RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1], "420", MOCK_MAINNET_SPOKE_POOL, "Mainnet"),
    ]);
  });

  it("returns only relevant findings when one transaction includes a couple of relevant events and an irrelevant event together", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(REIMBURSEMENT_EVENT, TEST_HUBPOOL_ADDR, [
        RANDOM_ADDRESSES[0],
        RANDOM_ADDRESSES[1],
        "0x1A4",
        MOCK_POLYGON_SPOKE_POOL,
      ])
      .addEventLog(REIMBURSEMENT_EVENT, TEST_HUBPOOL_ADDR, [
        RANDOM_ADDRESSES[0],
        RANDOM_ADDRESSES[1],
        "0x1A4",
        MOCK_MAINNET_SPOKE_POOL,
      ])
      .addEventLog(NEW_EVENT, TEST_HUBPOOL_ADDR, [true]);

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createBotFinding(RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1], "420", MOCK_POLYGON_SPOKE_POOL, "Polygon"),
      createBotFinding(RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1], "420", MOCK_MAINNET_SPOKE_POOL, "Mainnet"),
    ]);
  });
});
