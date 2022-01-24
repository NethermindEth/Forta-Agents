import { Finding, FindingSeverity, FindingType } from 'forta-agent';

export const CONTRACTS = [
  '0x0da6ed8b13214ff28e9ca979dd37439e8a88f6c4', // STAX
  '0xb0e1fc65c1a741b4662b813eb787d369b8614af1', // IF
  '0x0b15ddf19d47e6a86a56148fb4afffc6929bcb89', // IDIA
  '0x1d37f1e6f0cce814f367d2765ebad5448e59b91b', // IF Allocation Master V1.5
  '0x918d7e714243F7d9d463C37e106235dCde294ffC', // Swap Factory V1
  '0x8f2A0d8865D995364DC6843D51Cf6989001f989e', // Swap Router V1
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
