import { BigNumber } from "ethers";
import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";

type FindingGenerator = (_: LogDescription) => Finding;

const DepositFinding: FindingGenerator = (log: LogDescription): Finding => Finding.fromObject({
  name: "Pickle Jar Deposit",
  description: "Large deposit detected",
  alertId: "pickle-2-1",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  protocol: "Pickle Finance",
  metadata: {
    jar: log.address.toString(),
    amount: log.args[2].toString(),
    from: log.args[1].toLowerCase(),
  }
});

const WithdrawFinding: FindingGenerator = (log: LogDescription): Finding => Finding.fromObject({
  name: "Pickle Jar Withdraw",
  description: "Large withdraw detected",
  alertId: "pickle-2-2",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  protocol: "Pickle Finance",
  metadata: {
    jar: log.address.toString(),
    amount: log.args[2].toString(),
    from: log.args[0].toLowerCase(),
  }
});

export const createFinding: FindingGenerator = (log: LogDescription): Finding =>
  BigNumber.from(0).eq(log.args[0])? DepositFinding(log) : WithdrawFinding(log);
