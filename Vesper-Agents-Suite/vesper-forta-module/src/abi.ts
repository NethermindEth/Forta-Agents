import { AbiItem } from "web3-utils";

export const STRATEGY: AbiItem = {
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

export const STRATEGY_ABI = [
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
  },
  {
    inputs: [],
    name: "borrowCToken",
    outputs: [{ internalType: "contract cToken", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "supplyCToken",
    outputs: [{ internalType: "contract CToken", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "comptroller",
    outputs: [{ internalType: "contract comptroller", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [], "name": "pool",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "maxBorrowLimit",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as AbiItem[];

export const GET_STRATEGIES: AbiItem = {
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

export const POOL_ABI = [
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
  },{
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },,
] as AbiItem[];

export const ACCOUNTANT_ABI =
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
  STRATEGY_ABI,
  GET_STRATEGIES,
  POOL_ABI,
  ACCOUNTANT_ABI,
};
