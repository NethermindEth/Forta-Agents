import { Interface } from "@ethersproject/abi";
import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";
import { utils as ethers } from "ethers";

const EVENTS_ABI: string[] = [
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
  "event TransferredFarmAdmin(address indexed previousFarmAdmin, address indexed newFarmAdmin)",
];
const EVENTS_IFACE: Interface = new Interface(EVENTS_ABI);

const FUNCTIONS_ABI: string[] = ["function dev(address _devaddr)"];
const FUNCTIONS_IFACE: Interface = new Interface(FUNCTIONS_ABI);

const createEventFinding = (log: LogDescription, contract: string): Finding => {
  switch (log.args.newOwner == "0x0000000000000000000000000000000000000000") {
    case true:
      return Finding.fromObject({
        name: `${contract}: Ownership renounced`,
        description: `${log.name} event emitted from ${contract} contract setting newOwner to Null address`,
        alertId: "APESWAP-9-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Apeswap",
        metadata: {
          previousOwner: log.args.previousOwner.toLowerCase(),
          newOwner: log.args.newOwner.toLowerCase(),
        },
      });
    default:
      if (log.args.newOwner)
        return Finding.fromObject({
          name: `${contract}: Ownership transferred`,
          description: `${log.name} event emitted from ${contract} contract`,
          alertId: "APESWAP-9-2",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "Apeswap",
          metadata: {
            previousOwner: log.args.previousOwner.toLowerCase(),
            newOwner: log.args.newOwner.toLowerCase(),
          },
        });
      else
        return Finding.fromObject({
          name: `${contract}: Farm admin changed`,
          description: `${log.name} event emitted from ${contract} contract`,
          alertId: "APESWAP-9-3",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "Apeswap",
          metadata: {
            previousFarmAdmin: log.args.previousFarmAdmin.toLowerCase(),
            newFarmAdmin: log.args.newFarmAdmin.toLowerCase(),
          },
        });
  }
};

const createFunctionFinding = (call: ethers.TransactionDescription): Finding => {
  return Finding.fromObject({
    name: "MasterApe: dev address changed",
    description: `${call.name} function was called on MasterApe contract`,
    alertId: "APESWAP-9-4",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Apeswap",
    metadata: {
      newDevAddress: call.args._devaddr.toLowerCase(),
    },
  });
};

export default {
  EVENTS_ABI,
  EVENTS_IFACE,
  FUNCTIONS_ABI,
  FUNCTIONS_IFACE,
  createEventFinding,
  createFunctionFinding,
};
