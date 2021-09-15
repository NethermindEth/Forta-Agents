import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";

import Web3 from "web3";
import abi from "../utils/curve-gauge";

// @ts-ignore
import abiDecoder from "abi-decoder";
abiDecoder.addABI(abi);

export const web3 = new Web3();

export const setKilled = {
  name: "set_killed",
  outputs: [],
  inputs: [{ type: "bool", name: "_is_killed" }],
  stateMutability: "nonpayable",
  type: "function",
  gas: 36878,
};

const createFinding = (alertId: string): Finding => {
  return Finding.fromObject({
    name: "Set Killed funciton called",
    description: "Set Killed funciton called on pool",
    alertId: alertId,
    severity: FindingSeverity.Low,
    type: FindingType.Suspicious,
  });
};

export default function providesetKilledAgent(
  alertID: string,
  address: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    if (txEvent.addresses[address] == false) return findings;

    const data = abiDecoder.decodeMethod(txEvent.transaction.data);
    if (!data) return findings;

    if (data.name === "set_killed") {
      findings.push(createFinding(alertID));
    }

    return findings;
  };
}
