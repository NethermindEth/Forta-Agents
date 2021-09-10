import Web3 from "web3";
import {
  TransactionEvent,
  Log,
  Network,
  EventType,
  createTransactionEvent,
  BlockEvent,
  Finding,
  FindingSeverity,
  FindingType,
} from "forta-agent";
import { FindingGenerator } from "./utils";
import { keccak256 } from "forta-agent/dist/sdk/utils";

export const createTxEventWithEventLogged = (
  eventSignature: string,
  address: string,
  restTopics: string[] = [],
  data: string = ""
): TransactionEvent => {
  const log: Log = {
    address,
    topics: [keccak256(eventSignature), ...restTopics],
    data: data,
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

export const generalTestFindingGenerator: FindingGenerator = (txEvent: TransactionEvent | BlockEvent): Finding => {
  return Finding.fromObject({
    name: "Finding Test",
    description: "Finding for test",
    alertId: "TEST",
    severity: FindingSeverity.Low,
    type: FindingType.Unknown,
  });
};

export const createAddress = (suffix: string): string => {
  return Web3.utils.leftPad(suffix, 40);
};
