import { Finding, FindingSeverity, FindingType } from "forta-agent";

// TODO: Confirm L11 works
// as expected
const createFinding = (
    name: string,
    description: string,
    alertID: string,
    severity: FindingSeverity,
    type: FindingType,
    metadata?: { [key: string]: any }
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