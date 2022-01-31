import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";

type FindingGenerator = (log: LogDescription) => Finding;

const addLiquity: FindingGenerator = (log: LogDescription): Finding =>
  Finding.fromObject({
    name: "Impossible Finance Pair Liquidity Action",
    description: "Large liquidity Added",
    alertId: "impossible-9-1",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      pair: log.address.toLowerCase(),
      amount0: log.args.amount0.toString(),
      amount1: log.args.amount1.toString(),
      sender: log.args.sender.toLowerCase(),
    },
  });

const removeLiquity: FindingGenerator = (log: LogDescription): Finding =>
  Finding.fromObject({
    name: "Impossible Finance Pair Updated",
    description: "Liquidity Removed",
    alertId: "impossible-9-2",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      pair: log.address.toLowerCase(),
      amount0: log.args.amount0.toString(),
      amount1: log.args.amount1.toString(),
      sender: log.args.sender.toLowerCase(),
      to: log.args.to.toLowerCase(),
    },
  });

const findingsRouter: Record<string, FindingGenerator> = {
  Mint: addLiquity,
  Burn: removeLiquity,
};

const createFinding: FindingGenerator = (log: LogDescription): Finding =>
  findingsRouter[log.name](log);

export default createFinding;
