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
import abi from "./abi";

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
const address = "0xDeBF20617708857ebe4F679508E7b7863a8A8EeE";

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  if (!txEvent.addresses[address]) return findings;

  const data = abiDecoder.decodeMethod(txEvent.transaction.data);

  if (!data) return findings;

  if (data.name === "kill_me") {
    findings.push(
      Finding.fromObject({
        name: "Kill Me funciton called",
        description: "Kill Me funciton called on pool",
        alertId: "NETHFORTA-24",
        severity: FindingSeverity.Low,
        type: FindingType.Suspicious,
      })
    );
  }

  return findings;
};

export default {
  handleTransaction,
  // handleBlock
};
