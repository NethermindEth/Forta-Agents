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

const count: Number = 0;

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  // txEvent.
  console.log(txEvent.transaction);
  const callData = txEvent.transaction.data;

  const decodeData = abiDecoder.decodeMethod(callData);
  console.log(decodeData);

  return findings;
};

export default {
  handleTransaction,
};
