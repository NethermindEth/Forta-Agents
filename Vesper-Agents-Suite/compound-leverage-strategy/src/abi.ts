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
      }
    ]
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
      }
    ]
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
      }
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
      }
    ] 
  },
] as AbiItem[];
