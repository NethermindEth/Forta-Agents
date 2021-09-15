import { TransactionEvent, Log, Network, EventType } from "forta-agent";
import { createTransactionEvent, keccak256 } from "forta-agent/dist/sdk/utils";
import Web3 from "web3";


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

export const toWei = Web3.utils.toWei;

export const encodeParameter = (type: string, value: string): string => {
  return new Web3().eth.abi.encodeParameter(type, value);
}