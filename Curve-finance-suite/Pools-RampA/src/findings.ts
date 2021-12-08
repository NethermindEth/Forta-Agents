import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";

type FindingGenerator = (log: LogDescription) => Finding;

const rampFinding: FindingGenerator = (log: LogDescription) =>
  Finding.fromObject({
    name: "Pools event detected",
    description: "RampA event emitted on pool",
    alertId: "CURVE-10-1",
    protocol: "Curve Finance",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      address: log.address,
      oldA: `${log.args["old_A"]}`,
      newA: `${log.args["new_A"]}`,
      initialTime: `${log.args["initial_time"]}`,
      futureTime: `${log.args["future_time"]}`,
    },
  });

const stopRampFinding: FindingGenerator = (log: LogDescription) =>
  Finding.fromObject({
    name: "Pools event detected",
    description: "StopRampA event emitted on pool",
    alertId: "CURVE-10-2",
    protocol: "Curve Finance",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      address: log.address,
      A: `${log.args["A"]}`,
      T: `${log.args["t"]}`,
    },
  });

const findings: Record<string, FindingGenerator> = {
  "RampA": rampFinding,
  "StopRampA": stopRampFinding,
};

const createFinding: FindingGenerator = (log: LogDescription) => findings[log.name](log);

export default {
  createFinding,
  rampFinding,
  stopRampFinding,
};
