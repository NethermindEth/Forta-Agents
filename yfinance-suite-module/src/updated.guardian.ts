import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";

export const EVENT_SIGNATURE: string = "";

export const createFinding = (alertId: string, yearnVaultAddress: string): Finding => {
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

export default function provideUpdatedGuardianAgent(yearnVaultAddress: string): HandleTransaction {
    return async (txEvent: TransactionEvent): Promise<Finding[]> => {
        const findings: Finding[] = [];

        return findings;
    }
};