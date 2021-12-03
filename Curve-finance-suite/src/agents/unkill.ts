import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";
import Web3 from "web3";
import abi from "../utils/stable.swap.abi";
import {
  provideFunctionCallsDetectorAgent,
  FindingGenerator,
} from "nethermindeth-general-agents-module";

// @ts-ignore
import abiDecoder from "abi-decoder";
abiDecoder.addABI(abi);

export const web3 = new Web3();

export const unkill = {
  name: "unkill_me",
  outputs: [],
  inputs: [],
  stateMutability: "nonpayable",
  type: "function",
  gas: 22195,
};

const createFinding = (alertID: string): Finding => {
  return Finding.fromObject({
    name: "UnKill Me funciton called",
    description: "UnKill Me funciton called on pool",
    alertId: alertID,
    severity: FindingSeverity.Low,
    type: FindingType.Suspicious,
  });
};

const createFindingGenerator = (alertId: string): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined): Finding => {
    return createFinding(alertId);
  };
};

export default function provideUnkillAgent(
  alertID: string,
  address: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const agentHandler = provideFunctionCallsDetectorAgent(
      createFindingGenerator(alertID),
      unkill as any,
      { to: address }
    );

    const findings: Finding[] = await agentHandler(txEvent);
    if (txEvent.addresses[address] == false) return findings;

    const data = abiDecoder.decodeMethod(txEvent.transaction.data);
    if (!data) return findings;

    if (data.name === "unkill_me") {
      findings.push(createFinding(alertID));
    }

    return findings;
  };
}