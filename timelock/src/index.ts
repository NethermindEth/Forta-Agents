import BigNumber from "bignumber.js";
import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getJsonRpcUrl,
} from "forta-agent";

import { Log } from "forta-agent/dist/sdk/receipt";

const HIGH_GAS_THRESHOLD = "7000000";
export const timelockEvents = [
  "CallScheduled(bytes32, uint256, address, uint256, bytes, bytes32,uint256)",
  "CallExecuted(bytes32, uint256, address, uint256, bytes)",
  "MinDelayChange(uint256,uin256)",
  "Cancelled(bytes32)",
];

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  // gas too low condition
  if (new BigNumber(txEvent.gasUsed).isLessThan(HIGH_GAS_THRESHOLD))
    return findings;
  // if no timelockEvents was fired
  const timeLockEvents = timelockEvents.filter((value) => {
    return txEvent.filterEvent(value).length === 0 ? false : true;
  });

  if (!timeLockEvents.length) return findings;

  findings.push(
    Finding.fromObject({
      name: "TimeLock",
      description: `TimeLock initiated`,
      alertId: "FORTA-1",
      severity: FindingSeverity.Low,
      type: FindingType.Suspicious,
      metadata: {
        events: JSON.stringify(timeLockEvents),
      },
    })
  );

  return findings;
};

export default {
  handleTransaction,
};
