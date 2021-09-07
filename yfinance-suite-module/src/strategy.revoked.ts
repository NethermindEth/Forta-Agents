import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";

export const EVENT_SIGNATURE: string = "StrategyRevoked(address)";

export const createFinding = (alertId: string, yearnVaultAddress: string): Finding => {
  return Finding.fromObject({
    name: "Yearn Finance Strategy Revoked",
    description: "Detects Strategy Revoked event on the watched Yearn Vault",
    alertId,
    type: FindingType.Suspicious,
    severity: FindingSeverity.Medium,
    metadata: {
      YearnVault: yearnVaultAddress,
    },
  });
};

export default function provideEmergencyShutdownAgent(yearnVaultAddress: string, alertId: string): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    if (txEvent.filterEvent(EVENT_SIGNATURE, yearnVaultAddress).length > 0) {
      findings.push(createFinding(alertId, yearnVaultAddress));
    }

    return findings;
  };
}
