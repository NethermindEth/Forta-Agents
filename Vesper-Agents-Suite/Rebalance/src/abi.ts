import { AbiItem } from "web3-utils";

const POOLS: AbiItem = {
  name: "pools",
  type: "function",
  inputs: [],
  outputs: [{
    name: 'poolsList',
    type: 'address',
  }],
} as AbiItem;

const STRATEGY: AbiItem = {
  name: "strategy",
  type: "function",
  inputs: [{
    name: 'pool',
    type: 'address',
  }],
  outputs: [{
    name: 'strategy',
    type: 'address',
  }],
} as AbiItem;

const GET_STRATEGIES: AbiItem = {
  name: "getStrategies",
  type: "function",
  inputs: [],
  outputs: [{
    name: 'strategiesList',
    type: 'address[]',
  }],
} as AbiItem;

const AT: AbiItem = {
  name: "at",
  type: "function",
  inputs: [{
    name: "index",
    type: "uint256",
  }],
  outputs: [{
      name: 'pool',
      type: 'address',
    }, {
      name: '_',
      type: 'uint256',
  }],
} as AbiItem;

const LENGHT: AbiItem = {
    name: "length",
    type: "function",
    inputs: [],
    outputs: [{
        name: 'length',
        type: 'uint256',
    }],
  } as AbiItem;

export default {
    POOLS,
    STRATEGY,
    GET_STRATEGIES,
    AT,
    LENGHT,
};
