import { utils } from "ethers";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

const createFinding = (call: utils.TransactionDescription): Finding => {
  if (call.name == "setMigrator") {
    return Finding.fromObject({
      name: "MasterChef Settings",
      description: `${call.name} function called in MasterChef contract.`,
      alertId: "CAKE-5-1",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "MasterChef",
      metadata: {
        _migrator: call.args["_migrator"].toLowerCase(),
      },
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
      metadata: {
        _devaddr: call.args["_devaddr"].toLowerCase(),
      },
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
      metadata: {
        _allocPoint: call.args["_allocPoint"].toString(),
        _lpToken: call.args["_lpToken"].toLowerCase(),
        _withUpdate: call.args["_withUpdate"],
      },
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
      metadata: {
        _pid: call.args["_pid"].toString(),
        _allocPoint: call.args["_allocPoint"].toString(),
        _withUpdate: call.args["_withUpdate"],
      },
    });
  } else
    return Finding.fromObject({
      name: "MasterChef Settings",
      description: `${call.name} function called in MasterChef contract.`,
      alertId: "CAKE-5-5",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "MasterChef",
      metadata: {
        multiplierNumber: call.args["multiplierNumber"].toString(),
      },
    });
};

export default {
  createFinding,
};
