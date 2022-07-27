import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { TransactionDescription } from "forta-agent/dist/sdk/transaction.event";
import { FACTORY, CREATE_PAIR_FUNCTION } from "./constants";
import { createPair } from "./utils";
import { createFinding } from "./finding";

export const provideHandleTransaction = (factory: string, functionAbi: string, createPair: any): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const txLogs: TransactionDescription[] = txEvent.filterFunction(functionAbi, factory);
    if (!txLogs) return findings;

    txLogs.forEach((log) => {
      const { args } = log;
      const tokenA: string = args[0].toLowerCase();
      const tokenB: string = args[1].toLowerCase();

      // sort token0 and token1
      const token0: string = tokenA < tokenB ? tokenA : tokenB;
      const token1: string = tokenA < tokenB ? tokenB : tokenA;

      const newPair: string = createPair(factory, token0, token1);
      findings.push(createFinding(token0, token1, newPair));
    });
    return findings;
  };
};
export default {
  handleTransaction: provideHandleTransaction(FACTORY, CREATE_PAIR_FUNCTION, createPair),
};
