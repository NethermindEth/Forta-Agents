import BigNumber from "bignumber.js";
import {
  BlockEvent,
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";

import { Log } from "forta-agent/dist/sdk/receipt";

export const timelockEvents = [
  "MinDelayChange(uint256,uin256)",
  "CallScheduled(bytes32,uint256,address,uint256,bytes,bytes32,uint256)",
  "Cancelled(bytes32)",
  "CallExecuted(bytes32,uint256,address,uint256,bytes)",
];

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  const timeLockEvents = timelockEvents.filter((value) => {
    const event = txEvent.filterEvent(value);
    return event.length === 0 ? false : true;
  });

  if (!timeLockEvents.length) return findings;

  timeLockEvents.forEach((value) => {
    findings.push(
      Finding.fromObject({
        name: "TimeLock",
        description: "TimeLock initiated",
        alertId: "NETHFORTA-12",
        severity: FindingSeverity.Low,
        type: FindingType.Suspicious,
        metadata: {
          events: JSON.stringify(value),
        },
      })
    );
  });
  return findings;
};

export default {
  handleTransaction,
};
