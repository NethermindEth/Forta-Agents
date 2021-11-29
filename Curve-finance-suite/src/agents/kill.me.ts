import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from 'forta-agent';
import { FindingGenerator, provideFunctionCallsDetectorHandler } from "forta-agent-tools";
export const KILL_ME_SIGNATURE = 'kill_me()';



const createFindingGenerator = (alertId: string): FindingGenerator => {
  return () => {
  return Finding.fromObject({
    name: 'Kill Me funciton called',
    description: 'Kill Me funciton called on pool',
    alertId: alertId,
    severity: FindingSeverity.Low,
    type: FindingType.Suspicious,
  });
  }
};

export default function provideKillMeAgent(
  alertID: string,
  address: string
): HandleTransaction {
  const agentHandler = provideFunctionCallsDetectorHandler(
    createFindingGenerator(alertID), 
    KILL_ME_SIGNATURE, 
  );
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = await agentHandler(txEvent);
    return findings;
  };
  };

