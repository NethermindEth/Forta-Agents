import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  Trace
} from 'forta-agent';
import {
  Counter,
  reentracyLevel,
  createFinding,
} from './agent.utils';

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
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
    while(stack.length > curStack.length){
      // @ts-ignore
      const last: string = stack.pop();
      currentCounter[last] -= 1;
    }
    const to: string = trace.action.to;
    currentCounter[to] += 1;
    maxReentrancyNumber[to] = Math.max(
      maxReentrancyNumber[to], 
      currentCounter[to],
    );
    stack.push(to);
  });

  // Create findings if needed
  addresses.forEach((addr: string) => {
    const maxCount: number = maxReentrancyNumber[addr]
    const [report, severity] = reentracyLevel(maxCount);
    if(report)
      findings.push(createFinding(addr, maxCount, severity));
  });

  return findings;
};

export default {
  handleTransaction,
};
