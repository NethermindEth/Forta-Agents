import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  Trace,
  FindingSeverity,
} from "forta-agent";
import { Counter, reentracyLevel, createFinding } from "./agent.utils";

export const thresholds: [number, FindingSeverity][] = [
  [3, FindingSeverity.Info],
  [5, FindingSeverity.Low],
  [7, FindingSeverity.Medium],
  [9, FindingSeverity.High],
  [11, FindingSeverity.Critical],
];

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  const maxReentrancyNumber: Counter = {};
  const currentCounter: Counter = {};

  // Add the addresses to the counters
  const addresses: string[] = [];
  txEvent.traces.forEach((trace: Trace) => {
    addresses.push(trace.action.to);
  });
  addresses.forEach((addr: string) => {
    maxReentrancyNumber[addr] = 1;
    currentCounter[addr] = 0;
  });

  const stack: string[] = [];

  // Review the traces stack
  txEvent.traces.forEach((trace: Trace) => {
    const curStack: number[] = trace.traceAddress;
    while (stack.length > curStack.length) {
      // @ts-ignore
      const last: string = stack.pop();
      currentCounter[last] -= 1;
    }
    const to: string = trace.action.to;
    currentCounter[to] += 1;
    maxReentrancyNumber[to] = Math.max(
      maxReentrancyNumber[to],
      currentCounter[to]
    );
    stack.push(to);
  });

  // Create findings if needed
  for (const addr in maxReentrancyNumber) {
    const maxCount: number = maxReentrancyNumber[addr];
    const [report, severity] = reentracyLevel(maxCount, thresholds);
    if (report) findings.push(createFinding(addr, maxCount, severity));
  }

  return findings;
};

export default {
  handleTransaction,
};
