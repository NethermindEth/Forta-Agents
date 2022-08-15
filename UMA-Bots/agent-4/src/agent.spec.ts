import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { REIMBURSEMENT_EVENT, HUBPOOL_ADDRESS } from "./constants";
import agent from "./agent";

const RANDOM_ADDRESS = "0x0000000000000000000000000000000000000012";
const RANDOM_ADDRESS_2 = "0x0000000000000000000000000000000000000068";
const RANDOM_ADDRESS_3 = "0x0000000000000000000000000000000000000419";
const ARBITRUM_SPOKE_POOL = "0xB88690461dDbaB6f04Dfad7df66B7725942FEb9C";

describe("Root Bundle Disputed agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  it("returns empty findings if there is no reimbursement", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().setFrom(
      HUBPOOL_ADDRESS
    );
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns empty findings if there a reimbursement is made from the wrong address", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESS)
      .addEventLog(REIMBURSEMENT_EVENT, RANDOM_ADDRESS, [
        RANDOM_ADDRESS,
        RANDOM_ADDRESS_2,
        "0x123",
        RANDOM_ADDRESS_3,
      ]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns a finding if a reimbursement is made on a relevant contract address", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      REIMBURSEMENT_EVENT,
      HUBPOOL_ADDRESS,
      [RANDOM_ADDRESS, RANDOM_ADDRESS_2, "0x1A4", ARBITRUM_SPOKE_POOL]
    );

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Relayer Reimbursement",
        description: `A token transfer took place from the l1 HubPool for Relayer reimbursement to a spokePool`,
        alertId: "UMA-REIMB",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        protocol: "Across v2",
        metadata: {
          l1Token: RANDOM_ADDRESS,
          l2Token: RANDOM_ADDRESS_2,
          amount: "420",
          to: ARBITRUM_SPOKE_POOL,
          chainName: "Arbitrum",
        },
      }),
    ]);
  });
});
