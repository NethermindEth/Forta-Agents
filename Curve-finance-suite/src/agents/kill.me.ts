import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from 'forta-agent';
import { FindingGenerator, provideFunctionCallsDetectorHandler } from "forta-agent-tools";
export const KILL_ME_SIGNATURE = 'kill_me()';



const createFindingGenerator = (alertId: string, address: string): FindingGenerator => {
  return () => {
  return Finding.fromObject({
    name: 'Kill Me function call Detected',
    description: 'Kill Me function called on pool',
    alertId: alertId,
    severity: FindingSeverity.Low,
    type: FindingType.Suspicious,
    metadata: {
      contractAddr: address,
    },
  });
  }
};

export default function provideKillMeAgent(
  alertID: string,
  address: string

): HandleTransaction {
  const agentHandler = provideFunctionCallsDetectorHandler(
    createFindingGenerator(alertID, address), 
    KILL_ME_SIGNATURE, {
      to: address,
    });
  ;
  
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = await agentHandler(txEvent);
    return findings;
  
  };
  };

