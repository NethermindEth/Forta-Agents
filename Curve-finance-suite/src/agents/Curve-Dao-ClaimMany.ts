import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";

import Web3 from "web3";
import abi from "../utils/fee-distribution";
import {
  provideFunctionCallsDetectorAgent,
  FindingGenerator,
} from "general-agents-module";

// @ts-ignore
import abiDecoder from "abi-decoder";
abiDecoder.addABI(abi);

export const web3 = new Web3();

export const claimMany = {
  name: "claim_many",
  outputs: [{ type: "bool", name: "" }],
  inputs: [{ type: "address[20]", name: "_receivers" }],
  stateMutability: "nonpayable",
  type: "function",
  gas: 26281905,
};

const createFinding = (alertId: string): Finding =>
  Finding.fromObject({
    name: "Claim Rewards function called",
    description: "Claim Rewards function called on pool",
    alertId: alertId,
    severity: FindingSeverity.Low,
    type: FindingType.Suspicious,
  });

const createFindingGenerator = (alertId: string): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined): Finding => {
    return createFinding(alertId);
  };
};

export default function provideclaimManyAgent(
  alertID: string,
  address: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const agentHandler = provideFunctionCallsDetectorAgent(
      createFindingGenerator(alertID),
      claimMany as any,
      { to: address }
    );

    const findings: Finding[] = await agentHandler(txEvent);

    if (!txEvent.addresses[address]) return findings;

    const data = abiDecoder.decodeMethod(txEvent.transaction.data);
    if (!data) return findings;

    if (data.name === "claim_many") {
      findings.push(createFinding(alertID));
    }

    return findings;
  };
}
