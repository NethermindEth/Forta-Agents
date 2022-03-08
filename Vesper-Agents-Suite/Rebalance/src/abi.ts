import { AbiItem } from "web3-utils";

const STRATEGY: AbiItem = {
  name: "strategy",
  type: "function",
  inputs: [
    {
      name: "pool",
      type: "address",
    },
  ],
  outputs: [
    {
      name: "strategy",
      type: "address",
    },
  ],
} as AbiItem;

const GET_STRATEGIES: AbiItem = {
  name: "getStrategies",
  type: "function",
  inputs: [],
  outputs: [
    {
      name: "strategiesList",
      type: "address[]",
    },
  ],
} as AbiItem;

const PoolABI: AbiItem = {
  name: "poolAccountant",
  type: "function",
  inputs: [],
  outputs: [
    {
      type: "address",
      name: "",
    },
  ],
} as AbiItem;

export const Accountant_ABI = 
  {
    name: "strategy",
    type: "function",
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    outputs: [
      {
        internalType: "bool",
        name: "active",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "interestFee",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "debtRate",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lastRebalance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "totalDebt",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "totalLoss",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "totalProfit",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "debtRatio",
        type: "uint256",
      },
    ],
  } as AbiItem;

export default {
  STRATEGY,
  GET_STRATEGIES,
  PoolABI,
  Accountant_ABI,
};
