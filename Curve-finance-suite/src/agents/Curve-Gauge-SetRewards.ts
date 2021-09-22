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

export const setRewards = {
  name: "set_rewards",
  outputs: [],
  inputs: [
    { type: "address", name: "_reward_contract" },
    { type: "bytes32", name: "_sigs" },
    { type: "address[8]", name: "_reward_tokens" },
  ],
  stateMutability: "nonpayable",
  type: "function",
  gas: 2304194,
};

const createFinding = (alertId: string): Finding => {
  return Finding.fromObject({
    name: "Set Rewards funciton called",
    description: "Set Rewards funciton called on pool",
    alertId: alertId,
    severity: FindingSeverity.Low,
    type: FindingType.Suspicious,
  });
};

export default function providesetRewardsAgent(
  alertID: string,
  address: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    if (!txEvent.addresses[address]) return findings;

    const data = abiDecoder.decodeMethod(txEvent.transaction.data);
    if (!data) return findings;

    if (data.name === "set_rewards") {
      findings.push(createFinding(alertID));
    }

    return findings;
  };
}
