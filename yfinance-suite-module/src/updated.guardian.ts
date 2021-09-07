import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";

const EVENT_SIGNATURE: string = "UpdateGuardian(address)";


const createFinding = (alertId: string, yearnVaultAddress: string): Finding => {
    return Finding.fromObject({
        name: "Yearn Finance Updated Guardian",
        description: "Detects Updated Guardian event on the wathced Yearn Vault",
        alertId: alertId,
        type: FindingType.Suspicious,
        severity: FindingSeverity.Medium,
        metadata: {
            YearnVault: yearnVaultAddress
        },
    })
}


export default function provideUpdatedGuardianAgent(yearnVaultAddress: string, alertId: string): HandleTransaction {
    return async (txEvent: TransactionEvent): Promise<Finding[]> => {
        const findings: Finding[] = [];

        if (txEvent.filterEvent(EVENT_SIGNATURE, yearnVaultAddress).length > 0) {
            findings.push(createFinding(alertId, yearnVaultAddress));
        }

        return findings;
    }
};