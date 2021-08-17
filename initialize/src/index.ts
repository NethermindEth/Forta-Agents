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

export const functionSignature: string = "initialize(uint256)";

const count: Number = 0;

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  // txEvent.
  const callData = txEvent.transaction.data;

  return findings;
};

export default {
  handleTransaction,
};
