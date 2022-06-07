import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";

import { LENDING_POOL, DEPOSIT_ABI, BORROW_ABI, FLASHLOAN_ABI, createFinding } from "./utils";

export const provideHandleTransaction = (lendingPool: string): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const eventLogs = txEvent.filterLog([DEPOSIT_ABI, BORROW_ABI, FLASHLOAN_ABI], lendingPool);

    if (!eventLogs.length) return [];

    // first, check if FlashLoan event is emitted, and then look for Deposit and Borrow events
    if (eventLogs.some((event) => event.name == "FlashLoan")) {
      if (eventLogs.some((event) => event.name == "Deposit")) {
        findings.push(createFinding("Deposit", txEvent.transaction.from, txEvent.transaction.to));
      }

      if (eventLogs.some((event) => event.name == "Borrow")) {
        findings.push(createFinding("Borrow", txEvent.transaction.from, txEvent.transaction.to));
      }
    }

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(LENDING_POOL),
};
