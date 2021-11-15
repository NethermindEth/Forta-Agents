import { AbiItem } from "web3-utils";

export const earningReportedSignature =
  "EarningReported(address,uint256,uint256,uint256,uint256,uint256,uint256)";

export const reportLossABI = {
  name: "reportLoss",
  type: "function",
  inputs: [
    {
      type: "address",
      name: "",
    },
    {
      type: "uint256",
      name: "",
    },
  ],
} as AbiItem;

export const ControllerABI = [
  {
    name: "pools",
    type: "function",
    inputs: [],
    outputs: [
      {
        type: "address",
        name: "",
      },
    ],
  },
] as AbiItem[];

export const AddressListABI = [
  {
    name: "length",
    type: "function",
    inputs: [],
    outputs: [
      {
        type: "uint256",
        name: "",
      },
    ],
  },
  {
    name: "at",
    type: "function",
    inputs: [
      {
        type: "uint256",
        name: "index",
      },
    ],
    outputs: [
      {
        type: "address",
        name: "",
      },
    ],
  },
] as AbiItem[];

export const PoolABI = [
  {
    name: "poolAccountant",
    type: "function",
    inputs: [],
    outputs: [
      {
        type: "address",
        name: "",
      },
    ],
  },
] as AbiItem[];
