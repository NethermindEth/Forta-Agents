import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";

import Web3 from "web3";
import abi from "../utils/curve-dao-abi";

// @ts-ignore
import abiDecoder from "abi-decoder";
abiDecoder.addABI(abi);

export const web3 = new Web3();

export const createLock = {
  name: "create_lock",
  outputs: [],
  inputs: [
    { type: "uint256", name: "_value" },
    { type: "uint256", name: "_unlock_time" },
  ],
  stateMutability: "nonpayable",
  type: "function",
  gas: 74281465,
};

const createFinding = (alertId: string): Finding => {
  return Finding.fromObject({
    name: "Create Lock Event called",
    description: "Create Lock Event funciton called on pool",
    alertId: alertId,
    severity: FindingSeverity.Low,
    type: FindingType.Suspicious,
  });
};

export default function providecreateLockAgent(
  alertID: string,
  address: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    if (txEvent.addresses[address] == false) return findings;

    const data = abiDecoder.decodeMethod(txEvent.transaction.data);
    if (!data) return findings;

    if (data.name === "create_lock") {
      findings.push(createFinding(alertID));
    }

    return findings;
  };
}
