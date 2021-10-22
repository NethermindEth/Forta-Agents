import { AbiItem } from "web3-utils";

export const strategyABI = [
  {
    name: "currentBorrowRatio",
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
    name: "borrowRatioRange",
    type: "function",
    inputs: [],
    outputs: [
      {
        type: "uint256",
        name: "minBorrowRatio",
      },
      {
        type: "uint256",
        name: "maxBorrowRatio",
      },
    ],
  },

  {
    name: "NAME",
    type: "function",
    inputs: [],
    outputs: [
      {
        type: "string",
        name: "name",
      },
    ],
  },
] as AbiItem[];

export const comptrollerABI = [
  {
    name: "markets",
    type: "function",
    inputs: [
      {
        type: "address",
        name: "",
      },
    ],
    outputs: [
      {
        type: "bool",
        name: "isListed",
      },
      {
        type: "uint256",
        name: "collateralFactorMantissa",
      },
      {
        type: "bool",
        name: "isComped",
      },
    ],
  },
] as AbiItem[];

export const vesperControllerABI = [
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
  {
    name: "strategy",
    type: "function",
    inputs: [
      {
        type: "address",
        name: "",
      },
    ],
    outputs: [
      {
        type: "address",
        name: "strategy",
      },
    ],
  },
] as AbiItem[];

export const addressListABI = [
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

export const poolABI = [
  {
    name: "getStrategies",
    type: "function",
    inputs: [],
    outputs: [
      {
        type: "address[]",
        name: "strategies",
      },
    ],
  },
] as AbiItem[];
