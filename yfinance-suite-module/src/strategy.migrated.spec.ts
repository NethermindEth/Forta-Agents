import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import provideStrategyMigratedAgent from "./strategy.migrated";
import { createTxEventWithEventLogged } from "./test.utils";


const YEARN_VAULT_ADDRESS = "0x121212";
const ALERT_ID = "testID";
const EVENT_SIGNATURE = "StrategyMigrated(address,address)";



const createFinding = (): Finding => {
    return Finding.fromObject({
        name: "Yearn Finance Strategy Migrated",
        description: "Detects Strategy Migrated event on the watched Yearn Vault",
        alertId: ALERT_ID,
        type: FindingType.Suspicious,
        severity: FindingSeverity.Medium,
        metadata: {
            YearnVault: YEARN_VAULT_ADDRESS 
        },
    })
};

describe("Yearn Finance Strategy Revoked Tests", () => {
  let handleTransaction: HandleTransaction;  

  beforeAll(() => {
    handleTransaction = provideStrategyMigratedAgent(YEARN_VAULT_ADDRESS, ALERT_ID);
  })

  it("should return empty findings if the expected event wasn't called", async () => {
    const txEvent: TransactionEvent = createTxEventWithEventLogged("badEvent", "0x121212");

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return empty findings if the event is not related with the specified vault", async () => {
    const txEvent: TransactionEvent = createTxEventWithEventLogged(EVENT_SIGNATURE, "0x0");

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return findings when the specified vault emit the expected event", async () => {
    const txEvent: TransactionEvent = createTxEventWithEventLogged(EVENT_SIGNATURE, YEARN_VAULT_ADDRESS);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([createFinding()]);
  });
});