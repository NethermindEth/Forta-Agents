import { TransactionEvent, Log, Network, EventType } from 'forta-agent';
import { createTransactionEvent, keccak256 } from 'forta-agent/dist/sdk/utils';

export const createTxEventWithLog = (
  eventSignature: string,
  address: string,
  args: any = [],
): TransactionEvent => {
  const log: Log = {
    address,
    topics: [keccak256(eventSignature), ...args],
  } as any;

  return createTransactionEvent({
    network: Network.MAINNET,
    type: EventType.BLOCK,
    block: {} as any,
    transaction: {} as any,
    receipt: {
      logs: [log],
    } as any,
  });
};
