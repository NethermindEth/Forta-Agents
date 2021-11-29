import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from 'forta-agent';
import { FindingGenerator, provideFunctionCallsDetectorHandler } from "forta-agent-tools";
export const KILL_ME_SIGNATURE = 'kill_me()';

import Web3 from 'web3';
import abi from '../utils/stable.swap.abi';

// @ts-ignore
import abiDecoder from 'abi-decoder';
abiDecoder.addABI(abi);

export const web3 = new Web3();

export const killme = {
  name: 'kill_me',
  outputs: [],
  inputs: [],
  stateMutability: 'nonpayable',
  type: 'function',
  gas: 38058,
};

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

