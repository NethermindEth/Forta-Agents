import { TransactionEvent, Log, Network, EventType, createTransactionEvent } from "forta-agent";
import { keccak256 } from "forta-agent/dist/sdk/utils";

export const createTxEventWithEventLogged = (eventSignature: string, address: string): TransactionEvent => {
  const log: Log = {
    address,
    topics: [keccak256(eventSignature)],
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