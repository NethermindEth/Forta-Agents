import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";

import Web3 from "web3";
import abi from "./stable-swap-abi";

// @ts-ignore
import abiDecoder from "abi-decoder";
abiDecoder.addABI(abi);

export const web3 = new Web3();

export const killme = {
  name: "kill_me",
  outputs: [],
  inputs: [],
  stateMutability: "nonpayable",
  type: "function",
  gas: 38058,
};

const createFinding = (alertId: string): Finding => {
  return Finding.fromObject({
    name: "Kill Me funciton called",
    description: "Kill Me funciton called on pool",
    alertId: alertId,
    severity: FindingSeverity.Low,
    type: FindingType.Suspicious,
  });
};

export default function provideKillMeAgent(
  alertID: string,
  address: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    if (txEvent.addresses[address] == false) return findings;

    const data = abiDecoder.decodeMethod(txEvent.transaction.data);
    if (!data) return findings;

    if (data.name === "kill_me") {
      findings.push(createFinding(alertID));
    }

    return findings;
  };
}
