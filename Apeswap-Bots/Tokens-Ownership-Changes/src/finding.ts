import {
  Finding,
  FindingSeverity,
  FindingType,
  LogDescription,
} from "forta-agent";
import NetworkData from "./network";

export const createFinding = (
  log: LogDescription,
  networkManager: NetworkData
): Finding => {
  let metadata;
  if (networkManager.networkId === 137 || networkManager.networkId === 80001) {
    metadata = {
      oldOwner: log.args.oldOwner.toLowerCase(),
      newOwner: log.args.newOwner.toLowerCase(),
    };
  } else {
    metadata = {
      previousOwner: log.args.previousOwner.toLowerCase(),
      newOwner: log.args.newOwner.toLowerCase(),
    };
  }
  switch (log.args.newOwner == "0x0000000000000000000000000000000000000000") {
    case true:
      return Finding.fromObject({
        name: `${
          log.address == networkManager.banana ? "BANANA" : "GNANA"
        }: Ownership renounced`,
        description: `${log.name} event emitted from ${
          log.address == networkManager.banana ? "BANANA" : "GNANA"
        } contract setting newOwner to Null address`,
        alertId: "APESWAP-6-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Apeswap",
        metadata: metadata,
      });
    default:
      return Finding.fromObject({
        name: `${
          log.address == networkManager.banana ? "BANANA" : "GNANA"
        }: Ownership transferred`,
        description: `${log.name} event emitted from ${
          log.address == networkManager.banana ? "BANANA" : "GNANA"
        } contract`,
        alertId: "APESWAP-6-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Apeswap",
        metadata: metadata,
      });
  }
};
