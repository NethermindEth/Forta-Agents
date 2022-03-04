import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";

type FindingGenerator = (log: LogDescription) => Finding;

const tradeFeesFinding: FindingGenerator = (log: LogDescription): Finding =>
  Finding.fromObject({
    name: "Impossible Finance Pair fees Updated",
    description: "Trade fee updated",
    protocol: "Impossible Finance",
    alertId: "IMPOSSIBLE-6-1",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      pair: log.address.toLowerCase(),
      oldFee: log.args._oldFee.toString(),
      newFee: log.args._newFee.toString(),
    },
  });

const withdrawalFeeRatioFinding: FindingGenerator = (log: LogDescription): Finding =>
  Finding.fromObject({
    name: "Impossible Finance Pair fees Updated",
    description: "Withdrawal fee ratio updated",
    protocol: "Impossible Finance",
    alertId: "IMPOSSIBLE-6-2",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      pair: log.address.toLowerCase(),
      oldFee: log.args._oldWithdrawalFee.toString(),
      newFee: log.args._newWithdrawalFee.toString(),
    },
  });

const findingsRouter: Record<string, FindingGenerator> = {
  UpdatedTradeFees: tradeFeesFinding,
  UpdatedWithdrawalFeeRatio: withdrawalFeeRatioFinding,
};

const createFinding: FindingGenerator = (log: LogDescription): Finding =>
  findingsRouter[log.name](log);

export default createFinding;
