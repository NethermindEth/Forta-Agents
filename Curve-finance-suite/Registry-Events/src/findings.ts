import { 
  Finding, 
  FindingSeverity, 
  FindingType, 
  LogDescription,
} from "forta-agent";

type FndingGenerator = (log: LogDescription) => Finding;

const poolRemoved: FndingGenerator = (log: LogDescription): Finding => 
  Finding.fromObject({
    name: 'Curve Registry contract called',
    description: 'Event PoolRemoved has been emitted',
    alertId: "CURVE-13-2",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: 'Curve Finance',
    metadata: {
      pool: log.args[0].toLowerCase(),
    }
  });

const poolAdded: FndingGenerator = (log: LogDescription): Finding =>     
  Finding.fromObject({
    name: 'Curve Registry contract called',
    description: 'Event PoolAdded has been emitted',
    alertId: "CURVE-13-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: 'Curve Finance',
    metadata: {
      pool: log.args[0].toLowerCase(),
      rate_method_id: log.args[1].toString(),
    }
  });

const functions: Record<string, FndingGenerator> = {
  "PoolAdded": poolAdded,
  "PoolRemoved": poolRemoved,
}

const resolver: FndingGenerator = (log: LogDescription) => functions[log.name](log);

export default {
  poolAdded,
  poolRemoved,
  resolver,
};
