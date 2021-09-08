import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";

const createFinding = (alertId: string, eventSignature: string): Finding => {
    return Finding.fromObject({
        name: "Event Checker",
        description: "The specified event was found",
        alertId,
        severity: FindingSeverity.Medium,
        type: FindingType.Exploit,
        metadata: {
            EventSignature: eventSignature
        },
    });
};

export default function provideEventCheckerHandler(eventSignature: string, alertId: string, address: string | undefined): HandleTransaction {
    return async (txEvent: TransactionEvent): Promise<Finding[]> => {
        const findings: Finding[] = [];

        if (txEvent.filterEvent(eventSignature, address).length > 1) {
            findings.push(createFinding(alertId, eventSignature));
        }

        return findings
    };
};