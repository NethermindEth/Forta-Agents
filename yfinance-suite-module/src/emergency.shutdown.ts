import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";

export const EVENT_SIGNATURE: string = "EmergencyShutdown(bool)";


export const createFinding = (alertId: string, yearnVaultAddress: string): Finding => {
    return Finding.fromObject({
        name: "Yearn Finance Emergency Shutdown",
        description: "Detects Emergency Shutdown event on the watched Yearn Vault",
        alertId,
        type: FindingType.Suspicious,
        severity: FindingSeverity.Medium,
        metadata: {
            YearnVault: yearnVaultAddress
        },
    })
}


export default function provideEmergencyShutdownAgent(yearnVaultAddress: string, alertId: string): HandleTransaction {
    return async (txEvent: TransactionEvent): Promise<Finding[]> => {
        const findings: Finding[] = [];

        if (txEvent.filterEvent(EVENT_SIGNATURE, yearnVaultAddress).length > 0) {
            findings.push(createFinding(alertId, yearnVaultAddress));
        }

        return findings;
    }
};