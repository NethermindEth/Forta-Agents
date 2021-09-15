import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
} from "forta-agent";
import provideMetaPoolDeployment, {
  DEPLOY_META_POOL_SIGNATURE,
} from "../agents/deployMetaPool";

import createTxEventWithLog from "../utils/createEventLog";

const ADDRESS = "0x1212";
const ALERT_ID = "test";

describe("Meta Pool Deployment Agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideMetaPoolDeployment(ALERT_ID, ADDRESS);
  });

  it("should return a finding", async () => {
    const txEvent: TransactionEvent = createTxEventWithLog(
      DEPLOY_META_POOL_SIGNATURE,
      ADDRESS
    );

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Deploy Meta Pool Event",
        description: "New meta pool is deployed",
        alertId: ALERT_ID,
        severity: FindingSeverity.Info,
        type: FindingType.Unknown,
      }),
    ]);
  });

  it("should return empty finding cause bad signature", async () => {
    const txEvent: TransactionEvent = createTxEventWithLog("badSig", ADDRESS);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return empty finding cause wrong Address", async () => {
    const txEvent: TransactionEvent = createTxEventWithLog(
      DEPLOY_META_POOL_SIGNATURE,
      "0x1111"
    );

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
