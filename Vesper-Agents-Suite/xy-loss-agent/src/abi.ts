import { AbiItem } from "web3-utils";

export const Strategy_ABI = [
  {
    inputs: [],
    name: "NAME",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "borrowCToken",
    outputs: [{ internalType: "contract cToken", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [], "name": "pool",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
] as AbiItem[];

export const Borrow_Token_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "borrowBalanceStored",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  }
] as AbiItem[];