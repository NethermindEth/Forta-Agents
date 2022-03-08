import { AbiItem } from "web3-utils";

export const V2POOL_ABI = [
  {
    inputs: [],
    name: "controller",
    outputs: [
      { internalType: "contract IController", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  }
] as AbiItem[];

export const CONTROLLER_ABI = [
  {
    inputs: [],
    name: "pools",
    outputs: [
      { internalType: "contract IAddressList", name: "", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "strategy",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
] as AbiItem[];

export const PoolABI = [
  {
    name: "poolAccountant",
    type: "function",
    inputs: [],
    outputs: [
      {
        type: "address",
        name: ""
      }
    ]
  }
] as AbiItem[];

export const Accountant_ABI = [
  {
    inputs: [],
    name: "getStrategies",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function"
  }
] as AbiItem[];

export const Strategy_ABI = [
  {
    inputs: [],
    name: "cm",
    outputs: [
      {
        internalType: "contract ICollateralManager",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
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
    name: "isUnderwater",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "lowWater",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "highWater",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalLocked",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalValue",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "collateralType",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function"
  }
] as AbiItem[];

export const CM_ABI = [
  {
    inputs: [{ internalType: "address", name: "_vaultOwner", type: "address" }],
    name: "getVaultInfo",
    outputs: [
      { internalType: "uint256", name: "collateralLocked", type: "uint256" },
      { internalType: "uint256", name: "daiDebt", type: "uint256" },
      { internalType: "uint256", name: "collateralUsdRate", type: "uint256" },
      { internalType: "uint256", name: "collateralRatio", type: "uint256" },
      { internalType: "uint256", name: "minimumDebt", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  }
] as AbiItem[];
