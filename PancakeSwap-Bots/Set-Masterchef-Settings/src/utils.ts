import { Interface } from "@ethersproject/abi";
import { utils } from "ethers";
import { Finding, FindingSeverity, FindingType } from "forta-agent";
import NetWorkData from "./network";

const FUNCTIONS_ABI: string[] = [
  "function setMigrator(IMigratorChef _migrator)",
  "function dev(address _devaddr)",
  "function add(uint256 _allocPoint, IBEP20 _lpToken, bool _withUpdate)",
  "function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate)",
  "function updateMultiplier(uint256 multiplierNumber)",
];

const FUNCTIONS_IFACE: Interface = new Interface(FUNCTIONS_ABI);

const createFinding = (call: utils.TransactionDescription, contract: NetWorkData): Finding => {
  if (call.name == "setMigrator") {
    return Finding.fromObject({
      name: "MasterChef Settings",
      description: `${call.name} function called in MasterChef contract.`,
      alertId: "CAKE-5-1",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "MasterChef",
      metadata: {},
    });
  }
  if (call.name == "dev") {
    return Finding.fromObject({
      name: "MasterChef Settings",
      description: `${call.name} function called in MasterChef contract.`,
      alertId: "CAKE-5-2",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "MasterChef",
      metadata: {},
    });
  }
  if (call.name == "add") {
    return Finding.fromObject({
      name: "MasterChef Settings",
      description: `${call.name} function called in MasterChef contract.`,
      alertId: "CAKE-5-3",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "MasterChef",
      metadata: {},
    });
  }
  if (call.name == "set") {
    return Finding.fromObject({
      name: "MasterChef Settings",
      description: `${call.name} function called in MasterChef contract.`,
      alertId: "CAKE-5-4",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "MasterChef",
      metadata: {},
    });
  } else
    return Finding.fromObject({
      name: "ApeFactory FeeTo setter address changed",
      description: `${call.name} function called in ApeFactory contract.`,
      alertId: "CAKE-5-5",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "MasterChef",
      metadata: {},
    });
};

export default {
  FUNCTIONS_ABI,
  FUNCTIONS_IFACE,
  createFinding,
};
