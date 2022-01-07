import { Finding, HandleTransaction, TransactionEvent } from 'forta-agent';
import { ABIs, BONDs, createFinding } from './utils';

export const provideHandlTransaction =
  (BONDs: string[]): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> =>
    BONDs.map((bond) =>
      txEvent.filterFunction(ABIs, bond).map((txn) => createFinding(txn, bond))
    ).flat();

export default {
  handleTransaction: provideHandlTransaction(BONDs),
  provideHandlTransaction,
};
