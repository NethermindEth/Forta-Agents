import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";

export const ABI = ["event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)"];

export const CONTRACTS = [
  "0x0da6ed8b13214ff28e9ca979dd37439e8a88f6c4", // STAX
  "0xb0e1fc65c1a741b4662b813eb787d369b8614af1", // IF
  "0x0b15ddf19d47e6a86a56148fb4afffc6929bcb89", // IDIA
  "0x1d37f1e6f0cce814f367d2765ebad5448e59b91b", // IF Allocation Master V1.5
];

export const createFinding = (log: LogDescription, contract: string) =>
  Finding.fromObject({
    name: "Ownership Transfers Detection ",
    description: "The ownership is trasferred.",
    alertId: "IMPOSSIBLE-3",
    severity: FindingSeverity.High,
    type: FindingType.Info,
    protocol: "Impossible Finance",
    metadata: {
      contract: contract,
      previousOwner: log.args["previousOwner"].toLowerCase(),
      newOwner: log.args["newOwner"].toLowerCase(),
    },
  });
