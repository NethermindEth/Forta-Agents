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
import { createFinding, isInArray } from "./agent.utils";
import AccountCashRecord, { createCashIn } from "./account.cash.record";

const TORNADO_ADDRESSES: string[] = [

];
const VALUE_THRESHOLD: bigint = BigInt(0);
const TIME_LIMIT: bigint = BigInt(0);

export const provideHandleTransaction = (
  tornadoAddresses: string[],
  valueThreshold: bigint,
  timeLimit: bigint
): HandleTransaction => {
  const createAccountCashRecord = (): AccountCashRecord => new AccountCashRecord(timeLimit);
  const accountCashRecords: { [key: string]: AccountCashRecord } = { };

  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const sender: string = txEvent.transaction.from;
    const to: string | null = txEvent.transaction.to;
    const timestamp: bigint = BigInt(txEvent.block.timestamp);
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
  handleTransaction: provideHandleTransaction(TORNADO_ADDRESSES, VALUE_THRESHOLD, TIME_LIMIT),
};
