import {
    Finding,
    FindingSeverity,
    FindingType,
} from 'forta-agent';
import { FindingGenerator } from 'nethermindeth-general-agents-module';
import createFinding from "./create.finding";

const createFindingGenerator = (
    name: string,
    description: string,
    alertId: string,
    severity: FindingSeverity,
    type: FindingType
): FindingGenerator => {
    return (metadata: { [key: string]: any } | undefined): Finding => {
        return createFinding(
            name,
            description,
            alertId,
            severity,
            type,
            metadata
        );
    };
};

export default createFindingGenerator;