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
] as AbiItem[];
