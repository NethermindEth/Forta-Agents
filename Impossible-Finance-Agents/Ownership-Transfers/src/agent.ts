import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { ABI, CONTRACTS, createFinding } from "./utils";

export const provideHandleTransaction =
  (contracts: string[]): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> =>
    contracts.map((contract) => txEvent.filterLog(ABI, contract).map((log) => createFinding(log, contract))).flat();

export default {
  handleTransaction: provideHandleTransaction(CONTRACTS),
  provideHandleTransaction,
};
