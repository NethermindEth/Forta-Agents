import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { createFinding, isInArray } from "./agent.utils";
import AccountCashRecord, { createCashIn } from "./account.cash.record";

const TORNADO_ADDRESSES: string[] = [
  "0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc",
  "0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936",
  "0x910cbd523d972eb0a6f4cae4618ad62622b39dbf",
  "0xa160cdab225685da1d56aa342ad8841c3b53f291",
];
const VALUE_THRESHOLD: bigint = BigInt("100000000000000000000"); // 100 ETH
const TIME_LIMIT: bigint = BigInt("86400"); // 1 day

export const provideHandleTransaction = (
  tornadoAddresses: string[],
  valueThreshold: bigint,
  timeLimit: bigint
): HandleTransaction => {
  const createAccountCashRecord = (): AccountCashRecord =>
    new AccountCashRecord(timeLimit);
  const accountCashRecords: { [key: string]: AccountCashRecord } = {};

  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const sender: string = txEvent.from;
    const to: string | null = txEvent.to;
    const timestamp: bigint = BigInt(txEvent.timestamp);
    const ethValue: bigint = BigInt(txEvent.transaction.value);

    if (!isInArray(tornadoAddresses, to)) {
      return findings;
    }

    if (accountCashRecords[sender] === undefined) {
      accountCashRecords[sender] = createAccountCashRecord();
    }

    const accountCashRecord = accountCashRecords[sender];
    accountCashRecord.addCashIn(createCashIn(ethValue, timestamp));
    const totalValueOfSender = accountCashRecord.getAmountIn();

    if (totalValueOfSender > valueThreshold) {
      findings.push(createFinding(sender));
    }

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(
    TORNADO_ADDRESSES,
    VALUE_THRESHOLD,
    TIME_LIMIT
  ),
};
