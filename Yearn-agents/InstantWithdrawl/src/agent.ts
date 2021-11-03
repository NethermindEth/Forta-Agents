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
import child from "child_process";

// @ts-ignore
import ganache from "ganache-cli";

let findingsCount = 0;

const handleBlock: HandleBlock = async (blockEvent: BlockEvent) => {
  const findings: Finding[] = [];

  // spin up ganache fork with mainnet
  // unlock a participating account
  // call withdraw function on the cli

  return findings;
};

export default {
  handleBlock,
};
