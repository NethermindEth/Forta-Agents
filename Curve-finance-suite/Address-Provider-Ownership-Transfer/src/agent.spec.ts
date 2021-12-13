import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
} from "forta-agent";
import { 
  TestTransactionEvent, 
  createAddress 
} from "forta-agent-tools";
import {
  provideCommitNewAdminEvent, 
  iface 
} from "./agent";

const ADDRESS = createAddress('0x1');
const ALERT_ID = "address-provider-ownership-transfer-test";
const DURATION = "1";
const NEW_ADMINS= [createAddress('0x4'), createAddress('0x5')];

const createFinding = (NEW_ADMIN: string) => Finding.fromObject({
  name: "Curve Admin Event Detected",
  description: "An ownership transfer has been initiated",
  alertId: ALERT_ID,
  severity: FindingSeverity.Medium,
  type: FindingType.Info,
  protocol: 'Curve Finance',
  metadata: {
    newAdmin: NEW_ADMIN,
  },
});

describe("Transfer Ownership Agent for Registry Contract", () => {
  let handleTransaction: HandleTransaction = provideCommitNewAdminEvent(ALERT_ID, ADDRESS);
  let topics1: string[];
  let topics2: string[];

  beforeAll(() => {
    topics1= [DURATION, NEW_ADMINS[0]];
    topics2 = [DURATION,NEW_ADMINS[1]];
  });

  it('Should return an empty findings when no event is emitted', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding for each CommitNewAdmin event emission", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      iface.getEvent('CommitNewAdmin').format('sighash'),
      ADDRESS, 
      '',
      ...topics1 
    ).addEventLog(
      iface.getEvent('CommitNewAdmin').format('sighash'),
      ADDRESS, 
      '',
      ...topics2 
    );

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([ 
      createFinding(NEW_ADMINS[0]),
      createFinding(NEW_ADMINS[1]),
    ]);
  });

  it("should return empty finding because of wrong signature", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      "wrongSignature()",
      ADDRESS,
      '',
      ...topics1 
    );

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore CommitNewAdmin events emitted by other contracts", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      iface.getEvent('CommitNewAdmin').format('sighash'),
      createAddress('0x2'),
      '',
      ...topics1 
    );

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });
});
