import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from 'forta-agent';

import Web3 from 'web3';
import abi from '../utils/fee.distribution';
import createFinding from "../utils/create.finding";
import createFindingGenerator from "../utils/create.finding.generator";
import { provideFunctionCallsDetectorAgent } from 'nethermindeth-general-agents-module';

// @ts-ignore
import abiDecoder from 'abi-decoder';
abiDecoder.addABI(abi);

export const web3 = new Web3();

export const claimMany = {
  name: 'claim_many',
  outputs: [{ type: 'bool', name: '' }],
  inputs: [{ type: 'address[20]', name: '_receivers' }],
  stateMutability: 'nonpayable',
  type: 'function',
  gas: 26281905,
};

export default function provideclaimManyAgent(
  alertID: string,
  address: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const agentHandler = provideFunctionCallsDetectorAgent(
      createFindingGenerator(
        "Claim Rewards function called",
        "Claim Rewards function called on pool",
        alertID,
        FindingSeverity.Low,
        FindingType.Suspicious
      ),
      claimMany as any,
      { to: address }
    );

    const findings: Finding[] = await agentHandler(txEvent);

    if (!txEvent.addresses[address]) return findings;

    const data = abiDecoder.decodeMethod(txEvent.transaction.data);
    if (!data) return findings;

    findings.push(createFinding(
      "Claim Rewards function called",
      "Claim Rewards function called on pool",
      alertID,
      FindingSeverity.Low,
      FindingType.Suspicious
    ));

    return findings;
  };
}
