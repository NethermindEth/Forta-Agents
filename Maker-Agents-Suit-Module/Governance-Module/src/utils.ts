import { AbiItem } from "web3-utils";
import BigNumber from "bignumber.js";
import Web3 from "web3";
import { 
  Log, 
  Block,
  Receipt, 
  Transaction, 
  TransactionEvent,
  createTransactionEvent,
  BlockEvent,
  createBlockEvent, 
} from "forta-agent";

const _web3: Web3 = new Web3();

export interface AddressManager {
  isKnownAddress(addr: string): boolean;
  update(addr: string | number): Promise<void>;
};

export type AddressVerifier = (addr: string) => boolean;

export type PropertyFetcher = (block: number, ...params: string[]) => Promise<any>;

export interface Set {
  [key: string]: boolean,
};

export const HAT_JSON_INTERFACE = {
  name: "hat",
  type: "function",
  inputs: [],
  outputs: [],
} as AbiItem;

export const APPROVALS_JSON_INTERFACE = {
  name: "approvals",
  type: "function",
  inputs: [
    {
      name: 'addr',
      type: 'address',
    }
  ],
  outputs: [
    {
      name: 'amount',
      type: 'uint256',
    }
  ],
} as AbiItem;

export enum HatFinding {
  UnknownHat = 0,
  HatModified = 1,
  FewApprovals = 2,
};

export enum LiftFinding {
  Lifter = 0,
  Spell = 1,
};

export const createAddr = (addr: string): string =>
  Web3.utils.leftPad(addr, 40);

export const createEncodedAddr = (addr: string): string =>
  _web3.eth.abi.encodeParameter(
    'address', 
    createAddr(addr),
  );

export const createEncodedUint256 = (value: BigNumber): string =>
  _web3.eth.abi.encodeParameter(
    'uint256', 
    value,
  );

export const hatCall = (): string =>
  _web3.eth.abi.encodeFunctionCall(HAT_JSON_INTERFACE, []);

export const approvalsCall = (addr: string): string =>
  _web3.eth.abi.encodeFunctionCall(APPROVALS_JSON_INTERFACE, [addr]);

export const decodeSingleParam = (ptype: string, encoded: string): any => 
  _web3.eth.abi.decodeParameters([ptype], encoded)[0]; 

export const argsToSet = (...list: string[]): Set => {
  const set: Set = {};
  list.forEach((s:string) => set[s] = true);
  return set;
};

export const toBalance = (value: BigNumber) =>
  value.multipliedBy(10 ** 18);

export const generateAddressVerifier = (...addresses: string[]): AddressVerifier => {
  const set: Set = argsToSet(...addresses.map(createAddr));
  return (addr: string): boolean =>
    (set[addr] !== undefined);
};

export const createLog = (address: string, ...topics: string[]): Log => {
  return {
    address: address,
    topics: topics,
  } as Log;
};

export const createTxEvent = (addresses: Set, ...logs: Log[]): TransactionEvent =>
  createTransactionEvent({
    logs: logs,
    transaction: {} as Transaction,
    block: {} as Block,
    addresses: addresses,
    contractAddress: null,
  });

export const createTestBlockEvent = (blockNumber: number): BlockEvent =>
  createBlockEvent({
    block: {
      hash: "0x0",
      number: blockNumber,
    } as Block,
  });

export const propertyFetcher = (
  web3Call: any, 
  address: string, 
  dataEncoder: any, 
  propertyType: string,
): PropertyFetcher => 
  async (block: number, ...params: string[]): Promise<any> => {
    const encodedValue = await web3Call({
      to: address, 
      data: dataEncoder(...params),
    }, block);
    return decodeSingleParam(propertyType, encodedValue);
  };
