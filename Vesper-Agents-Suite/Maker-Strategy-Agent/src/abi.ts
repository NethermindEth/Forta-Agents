import { AbiItem } from 'web3-utils';

export const CONTROLLER_ABI = [
  {
    inputs: [],
    name: 'pools',
    outputs: [
      { internalType: 'contract IAddressList', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'strategy',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as AbiItem[];

export const AddressListABI = [
  {
    name: 'length',
    type: 'function',
    inputs: [],
    outputs: [
      {
        type: 'uint256',
        name: '',
      },
    ],
  },
  {
    name: 'at',
    type: 'function',
    inputs: [
      {
        type: 'uint256',
        name: 'index',
      },
    ],
    outputs: [
      {
        type: 'address',
        name: '',
      },
    ],
  },
] as AbiItem[];

export const PoolABI = [
  {
    name: 'poolAccountant',
    type: 'function',
    inputs: [],
    outputs: [
      {
        type: 'address',
        name: '',
      },
    ],
  },
] as AbiItem[];

export const Accountant_ABI = [
  {
    inputs: [],
    name: 'getStrategies',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
] as AbiItem[];

export const Strategy_ABI = [
  {
    inputs: [],
    name: 'NAME',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'isUnderwater',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as AbiItem[];

export const IsUnderWater_Json_Interface = {
  inputs: [],
  name: 'isUnderwater',
  outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
  stateMutability: 'view',
  type: 'function',
} as AbiItem;
