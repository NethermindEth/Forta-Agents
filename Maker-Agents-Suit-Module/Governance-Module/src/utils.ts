import { AbiItem } from "web3-utils";

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
