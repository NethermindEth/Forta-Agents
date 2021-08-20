import BigNumber from "bignumber.js";
import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";
import Web3 from "web3";

// @ts-ignore
import abiDecoder from "abi-decoder";
import { abi } from "./abi";

abiDecoder.addABI(abi);

let count: number = 0;

type initializeFunctionSignature = {
  name: string;
  params: Array<any>;
};

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  // txEvent.

  const callData = txEvent.transaction.data;

  const decodeData: initializeFunctionSignature =
    abiDecoder.decodeMethod(callData);

  if (decodeData.name === "initialize") {
    count++;
  }

  if (count > 1) {
    findings.push(
      Finding.fromObject({
        name: "Initialize function",
        description: `The initialize function got called ${count} times.`,
        alertId: "NETHFORTA-8",
        type: FindingType.Suspicious,
        severity: FindingSeverity.Unknown,
        metadata: {
          count: count.toString(),
        },
      })
    );
  }

  return findings;
};

export default {
  handleTransaction,
};
