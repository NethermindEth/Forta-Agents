import { Finding, HandleTransaction, TransactionEvent } from 'forta-agent';
import { BONDs, ABIs, createFinding } from './utils';

export const provideHandleTransaction =
  (_bonds: string[]): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> =>
    _bonds
      .map((bond) =>
        txEvent.filterLog(ABIs, bond).map((log) => createFinding(log, bond))
      )
      .flat();

export default {
  handleTransaction: provideHandleTransaction(BONDs),
};
