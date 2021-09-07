import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import provideEmergencyShutdownAgent from "./emergency.shutdown";
import { createTxEventWithEventLogged } from "./test.utils";


const YEARN_VAULT_ADDRESS = "0x121212";
const ALERT_ID = "testID";
const EVENT_SIGNATURE = "EmergencyShutdown(bool)";



const createFinding = (): Finding => {
    return Finding.fromObject({
        name: "Yearn Finance Emergency Shutdown",
        description: "Detects Emergency Shutdown event on the watched Yearn Vault",
        alertId: ALERT_ID,
        type: FindingType.Suspicious,
        severity: FindingSeverity.Medium,
        metadata: {
            YearnVault: YEARN_VAULT_ADDRESS 
        },
    })
};

describe("Yearn Finance Emergency Shutdown Tests", () => {
  let handleTransaction: HandleTransaction;  

  beforeAll(() => {
    handleTransaction = provideEmergencyShutdownAgent(YEARN_VAULT_ADDRESS, ALERT_ID);
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