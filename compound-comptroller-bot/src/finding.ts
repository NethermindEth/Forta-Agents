import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (log: ethers.utils.LogDescription): Finding => {
  switch (log.signature) {
    case "ActionPaused(address,string,bool)":
      return Finding.from({
        name: "An action is paused on a market",
        description: `${log.args[1]} is paused on ${log.args[0]}`,
        alertId: "NETH-COMP-PAUSE-EVENT-1",
        protocol: "Compound",
        type: FindingType.Info,
        severity: FindingSeverity.Info,
        metadata: {
          CToken: log.args[0],
          action: log.args[1],
          pauseState: log.args[2].toString(),
        },
      });
    case "ActionPaused(string,bool)":
      return Finding.from({
        name: "A global action is paused",
        description: `${log.args[0]} is globally paused`,
        alertId: "NETH-COMP-PAUSE-EVENT-2",
        protocol: "Compound",
        type: FindingType.Info,
        severity: FindingSeverity.Info,
        metadata: {
          action: log.args[0],
          pauseState: log.args[1].toString(),
        },
      });
    default:
      return Finding.from({
        name: "Pause guardian is changed",
        description: "Pause guardian is changed on the Comptroller contract",
        alertId: "NETH-COMP-PAUSE-EVENT-3",
        protocol: "Compound",
        type: FindingType.Info,
        severity: FindingSeverity.Info,
        metadata: {
          oldPauseGuardian: log.args[0],
          newPauseGuardian: log.args[1],
        },
      });
  }
};
