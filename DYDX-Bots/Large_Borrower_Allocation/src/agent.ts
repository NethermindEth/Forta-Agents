import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { BigNumber } from "ethers";
import { PROXY_ADDRESS, THRESHOLD, SCHED_BORROW_ALLOC_CHANGE_EVENT } from "./utils";
import { createFinding } from "./findings";

export function provideHandleTransaction(proxyAddress: string, threshold: BigNumber): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // If `newAllocation` is greater than `threshold`, create a finding
    txEvent.filterLog([SCHED_BORROW_ALLOC_CHANGE_EVENT], proxyAddress).map((log) => {
      if (log.args.newAllocation.gt(threshold)) {
        findings.push(createFinding(log));
      }
    });

    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction(PROXY_ADDRESS, THRESHOLD),
};
