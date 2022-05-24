import { AbiItem } from "web3-utils";

export const Strategy_ABI = [
  {
    inputs: [],
    name: "isLossMaking",
    outputs: [
      {
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "NAME",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  }
] as AbiItem[];