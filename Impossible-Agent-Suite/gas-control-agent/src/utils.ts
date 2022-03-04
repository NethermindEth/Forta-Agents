import BigNumber from 'bignumber.js';
import { Finding, FindingSeverity, FindingType } from 'forta-agent';

export const CONTRACTS = [
  '0xb0e1fc65c1a741b4662b813eb787d369b8614af1', // IF
  '0x0b15ddf19d47e6a86a56148fb4afffc6929bcb89', // IDIA
  '0x1d37f1e6f0cce814f367d2765ebad5448e59b91b', // IF Allocation Master V1.5
  '0x918d7e714243F7d9d463C37e106235dCde294ffC', // Swap Factory V1
  '0x8f2A0d8865D995364DC6843D51Cf6989001f989e', // Swap Router V1
  '0x4233ad9b8b7c1ccf0818907908a7f0796a3df85f', // Swap v3 Factory
  '0x56f6ca0a3364fa3ac9f0e8e9858b2966cdf39d03', // Swap v3 Router
];

export const createFinding = (contract: string, gas: string) =>
  Finding.fromObject({
    name: 'High Gas Usage Detection',
    description: 'High gas is used - above 10',
    alertId: 'IMPOSSIBLE-2',
    severity: FindingSeverity.High,
    type: FindingType.Info,
    protocol: 'Impossible Finance',
    metadata: {
      contract: contract,
      gas: gas,
    },
  });

export const hexToNumber = (hex: string): BigNumber =>
  new BigNumber(hex).div(new BigNumber(10).pow(9));
