import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";

export function createFinding(log: ethers.utils.LogDescription): Finding {
  if (log.signature == "ActionPaused(address,string,bool)") {
    return Finding.from({
      name: "An action is paused on a market",
      description: `${log.args[1]} is paused on ${log.args[0]}`,
      alertId: "NETHFORTA-29",
      protocol: "Compound",
      type: FindingType.Info,
      severity: FindingSeverity.Info,
      metadata: {
        CToken: log.args[0],
        action: log.args[1],
        pauseState: log.args[2].toString(),
      },
    });
  } else if (log.signature === "ActionPaused(string,bool)") {
    return Finding.from({
      name: "A global action is paused",
      description: `${log.args[0]} is globally paused`,
      alertId: "NETHFORTA-30",
      protocol: "Compound",
      type: FindingType.Info,
      severity: FindingSeverity.Info,
      metadata: {
        action: log.args[0],
        pauseState: log.args[1].toString(),
      },
    });
  } else {
    return Finding.from({
      name: "Pause guardian is changed",
      description: "Pause guardian is changed on the comptroller contract",
      alertId: "NETHFORTA-31",
      protocol: "Compound",
      type: FindingType.Info,
      severity: FindingSeverity.Info,
      metadata: {
        oldPauseGuardian: log.args[0],
        newPauseGuardian: log.args[1],
      },
    });
  }
}
