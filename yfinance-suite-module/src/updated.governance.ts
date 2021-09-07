import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";

export const EVENT_SIGNATURE: string = "UpdateGovernance(address)";


export const createFinding = (alertId: string, yearnVaultAddress: string): Finding => {
    return Finding.fromObject({
        name: "Yearn Finance Updated Governance",
        description: "Detects Updated Governance event on the watched Yearn Vault",
        alertId: alertId,
        type: FindingType.Suspicious,
        severity: FindingSeverity.Medium,
        metadata: {
            YearnVault: yearnVaultAddress
        },
    })
}


export default function provideUpdatedGovernanceAgent(yearnVaultAddress: string, alertId: string): HandleTransaction {
    return async (txEvent: TransactionEvent): Promise<Finding[]> => {
        const findings: Finding[] = [];

        if (txEvent.filterEvent(EVENT_SIGNATURE, yearnVaultAddress).length > 0) {
            findings.push(createFinding(alertId, yearnVaultAddress));
        }

        return findings;
    }
};