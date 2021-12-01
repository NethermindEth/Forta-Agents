import { Finding, FindingSeverity, FindingType } from "forta-agent";

// TODO: figure out how to have "severity" and "type" as parameters
const createFinding = (
    name: string,
    description: string,
    alertID: string,
    severity: FindingSeverity,
    type: FindingType,
    metadata?: { data: string }
): Finding => {
    return Finding.fromObject({
        name,
        description,
        alertId: alertID,
        severity,
        type,
        metadata
    });
};

export default createFinding;