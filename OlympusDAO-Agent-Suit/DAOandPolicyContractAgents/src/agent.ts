import { Finding, HandleTransaction, TransactionEvent } from 'forta-agent';
import { provideEventCheckerHandler } from 'forta-agent-tools';
import {
  ADDED_OWNER_SIG,
  addresses,
  CHANGED_THRESHOLD_SIG,
  createAddedOwnerFindingGenerator,
  createChangedTHFindingGenerator,
  createRemovedOwnerFindingGenerator,
  REMOVED_OWNER_SIG,
} from './utils';

export const provideHandleTransaction = (): HandleTransaction => {
  return async (transactionEvent: TransactionEvent) => {
    const handlers: HandleTransaction[] = addresses
      .map((addr: string) => [
        provideEventCheckerHandler(
          createAddedOwnerFindingGenerator(addr),
          ADDED_OWNER_SIG,
          addr
        ),
        provideEventCheckerHandler(
          createRemovedOwnerFindingGenerator(addr),
          REMOVED_OWNER_SIG,
          addr
        ),
        provideEventCheckerHandler(
          createChangedTHFindingGenerator(addr),
          CHANGED_THRESHOLD_SIG,
          addr
        ),
      ])
      .flat();

    const findings: Finding[][] = await Promise.all(
      handlers.map((handler) => handler(transactionEvent))
    );

    return findings.flat();
  };
};

export default {
  handleTransaction: provideHandleTransaction(),
};
