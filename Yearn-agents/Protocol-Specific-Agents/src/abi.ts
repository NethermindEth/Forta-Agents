import { AbiItem } from 'web3-utils';

export const HelperABI = [
  {
    inputs: [],
    name: 'assetsAddresses',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'assetsLength',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as AbiItem[];

export const VaultABI = [
  {
    stateMutability: 'view',
    type: 'function',
    name: 'withdrawalQueue',
    inputs: [{ name: 'arg0', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
    gas: 4057,
  },
  {
    stateMutability: 'view',
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    gas: 13920,
  },
] as AbiItem[];

export const StrategyABI = [
  {
    inputs: [],
    name: 'isActive',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'ilk',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
] as AbiItem[];

export const OSM_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'peek',
    outputs: [
      { internalType: 'bytes32', name: '', type: 'bytes32' },
      { internalType: 'bool', name: '', type: 'bool' },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
] as AbiItem[];
