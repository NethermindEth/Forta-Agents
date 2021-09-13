import Web3 from "web3";
import {
  TransactionEvent,
  Network,
  EventType,
  Finding,
  FindingSeverity,
  FindingType,
  Receipt,
  Transaction,
  Block,
} from "forta-agent";
import { FindingGenerator } from "./utils";
import { keccak256 } from "forta-agent/dist/sdk/utils";

export const generalTestFindingGenerator: FindingGenerator = (): Finding => {
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

export class TestTransactionEvent extends TransactionEvent {
  constructor() {
    const transaction: Transaction = {
      data: "",
      from: createAddress("0x0"),
      to: createAddress("0x1"),
      value: "0",
    } as any;

    const receipt: Receipt = {
      gasUsed: "1000000",
      logs: [],
      status: true,
    } as any;

    const block: Block = {} as any;

    super(EventType.BLOCK, Network.MAINNET, transaction, receipt, [], {}, block);
  }

  public setFrom(address: string): TestTransactionEvent {
    this.transaction.from = address;
    return this;
  }

  public setTo(address: string): TestTransactionEvent {
    this.transaction.to = address;
    return this;
  }

  public setValue(value: string): TestTransactionEvent {
    this.transaction.value = value;
    return this;
  }

  public setData(data: string): TestTransactionEvent {
    this.transaction.data = data;
    return this;
  }

  public setGasUsed(value: string): TestTransactionEvent {
    this.receipt.gasUsed = value;
    return this;
  }

  public setStatus(status: boolean): TestTransactionEvent {
    this.receipt.status = status;
    return this;
  }

  public addEventLog(
    eventSignature: string,
    address: string = createAddress("0x0"),
    topics: string[] = [],
    data: string = ""
  ): TestTransactionEvent {
    this.receipt.logs.push({
      address: address,
      topics: [keccak256(eventSignature), ...topics],
      data: data,
    } as any);
    return this;
  }

  public addInvolvedAddress(address: string): TestTransactionEvent {
    this.addresses[address] = true;
    return this;
  }
}
