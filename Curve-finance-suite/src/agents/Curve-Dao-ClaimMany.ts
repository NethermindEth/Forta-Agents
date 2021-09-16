import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";

import Web3 from "web3";
import abi from "../utils/fee-distribution";

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

const createFinding = (alertId: string): Finding => {
  return Finding.fromObject({
    name: "Claim Rewards funciton called",
    description: "Claim Rewards funciton called on pool",
    alertId: alertId,
    severity: FindingSeverity.Low,
    type: FindingType.Suspicious,
  });
};

export default function provideclaimManyAgent(
  alertID: string,
  address: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    if (txEvent.addresses[address] == false) return findings;

    const data = abiDecoder.decodeMethod(txEvent.transaction.data);
    if (!data) return findings;

    if (data.name === "claim_many") {
      findings.push(createFinding(alertID));
    }

    return findings;
  };
}
