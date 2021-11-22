import { AbiItem } from "web3-utils";

const PROVIDER: AbiItem[] = [{
  name: "assetsAddresses",
  type: "function",
  inputs: [],
  outputs: [{
    name: "vaults",
    type: "address[]",
  }],
}];

const VAULT: AbiItem[] = [{
    name: "totalSupply",
    type: "function",
    inputs: [],
    outputs: [{
      name: "supply",
      type: "uint256",
    }],
  },{
    name: "depositLimit",
    type: "function",
    inputs: [],
    outputs: [{
      name: "limit",
      type: "uint256",
    }],
  },{
    name: "token",
    type: "function",
    inputs: [],
    outputs: [{
      name: "address",
      type: "address",
    }],
  },{
    name: "totalDebt",
    type: "function",
    inputs: [],
    outputs: [{
      name: "debt",
      type: "uint256",
    }],
}];

const TOKEN: AbiItem[] = [{
  name: "balanceOf",
  type: "function",
  inputs: [{
    name: "address",
    type: "address",
  }],
  outputs: [{
    name: "balance",
    type: "uint256",
  }],
}];

export default {
  PROVIDER,
  VAULT,
  TOKEN,
}
