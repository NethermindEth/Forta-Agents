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
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(RANDOM_ADDRESSES[1])
      .setFrom(HUBPOOL_ADDRESS)
      .addEventLog(REIMBURSEMENT_EVENT, HUBPOOL_ADDRESS, [
        RANDOM_ADDRESSES[0],
        RANDOM_ADDRESSES[1],
        "0x1A4",
        ARBITRUM_SPOKE_POOL,
      ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([
      Finding.from({
        name: "Relayer Reimbursement",
        description: `A token transfer took place from the l1 HubPool for Relayer reimbursement to a spokePool`,
        alertId: "UMA-REIMB",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        protocol: "Across v2",
        metadata: {
          l1Token: RANDOM_ADDRESSES[0],
          l2Token: RANDOM_ADDRESSES[1],
          amount: "420",
          to: ARBITRUM_SPOKE_POOL,
          chainName: "Arbitrum",
        },
      }),
    ]);
  });

  it("returns empty findings for other events emitted from target contract", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(RANDOM_ADDRESSES[1])
      .setFrom(HUBPOOL_ADDRESS)
      .addEventLog(NEW_EVENT, HUBPOOL_ADDRESS, [true]);
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
      Finding.from({
        name: "Relayer Reimbursement",
        description: `A token transfer took place from the l1 HubPool for Relayer reimbursement to a spokePool`,
        alertId: "UMA-REIMB",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        protocol: "Across v2",
        metadata: {
          l1Token: RANDOM_ADDRESSES[0],
          l2Token: RANDOM_ADDRESSES[1],
          amount: "420",
          to: OPTIMISM_SPOKE_POOL,
          chainName: "Optimism",
        },
      }),
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
      Finding.from({
        name: "Relayer Reimbursement",
        description: `A token transfer took place from the l1 HubPool for Relayer reimbursement to a spokePool`,
        alertId: "UMA-REIMB",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        protocol: "Across v2",
        metadata: {
          l1Token: RANDOM_ADDRESSES[0],
          l2Token: RANDOM_ADDRESSES[1],
          amount: "420",
          to: BOBA_SPOKE_POOL,
          chainName: "Boba",
        },
      }),
    ]);
  });

  
  it("returns a finding if a reimbursement is made on a relevant contract address to Optimism's spoke pool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(REIMBURSEMENT_EVENT, HUBPOOL_ADDRESS, [
      RANDOM_ADDRESSES[0],
      RANDOM_ADDRESSES[1],
      "0x1A4",
      MAINNET_SPOKE_POOL,
    ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([
      Finding.from({
        name: "Relayer Reimbursement",
        description: `A token transfer took place from the l1 HubPool for Relayer reimbursement to a spokePool`,
        alertId: "UMA-REIMB",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        protocol: "Across v2",
        metadata: {
          l1Token: RANDOM_ADDRESSES[0],
          l2Token: RANDOM_ADDRESSES[1],
          amount: "420",
          to: MAINNET_SPOKE_POOL,
          chainName: "Mainnet",
        },
      }),
    ]);
  });


  it("returns a finding if a reimbursement is made on a relevant contract address to Optimism's spoke pool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(REIMBURSEMENT_EVENT, HUBPOOL_ADDRESS, [
      RANDOM_ADDRESSES[0],
      RANDOM_ADDRESSES[1],
      "0x1A4",
      POLYGON_SPOKE_POOL,
    ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([
      Finding.from({
        name: "Relayer Reimbursement",
        description: `A token transfer took place from the l1 HubPool for Relayer reimbursement to a spokePool`,
        alertId: "UMA-REIMB",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        protocol: "Across v2",
        metadata: {
          l1Token: RANDOM_ADDRESSES[0],
          l2Token: RANDOM_ADDRESSES[1],
          amount: "420",
          to: POLYGON_SPOKE_POOL,
          chainName: "Polygon",
        },
      }),
    ]);
  });



});
