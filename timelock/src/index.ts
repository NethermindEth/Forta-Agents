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

import Web3 from "web3";

const web3 = new Web3(getJsonRpcUrl());

const HIGH_GAS_THRESHOLD = "7000000";
const CallScheduleEvent = [
  "CallScheduled(id, index, target, value, data, predecessor, delay)",
  "CallExecuted(id, index, target, value, data)",
  "MinDelayChange(oldDuration, newDuration)",
  "Cancelled(id)",
];

function provideHandleTransaction(web3: Web3): HandleTransaction {
  return async function handleTransaction(txEvent: TransactionEvent) {
    const findings: Finding[] = [];

    // gas too low condition
    if (new BigNumber(txEvent.gasUsed).isLessThan(HIGH_GAS_THRESHOLD))
      return findings;

    // if no CallScheduleEvent was fired
    const timeLockEvents = CallScheduleEvent.filter((value) => {
      return txEvent.filterEvent(value);
    });

    if (!timeLockEvents.length) return findings;

    findings.push(
      Finding.fromObject({
        name: "TimeLock",
        description: `TimeLock initiated`,
        alertId: "FORTA-1",
        severity: FindingSeverity.Low,
        type: FindingType.Suspicious,
      })
    );

    return findings;
  };
}

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(web3),
};
