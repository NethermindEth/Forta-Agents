import { AbiItem } from "web3-utils";
import BigNumber from "bignumber.js";
import Web3 from "web3";

const _web3: Web3 = new Web3();

export type AddressVerifier = (addr: string) => Promise<boolean>;

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
  
export const isAddressKnown: AddressVerifier = async (adrress: string): Promise<boolean> => {
  return false;
};
