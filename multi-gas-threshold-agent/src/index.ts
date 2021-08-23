import BigNumber from "bignumber.js";
import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";

export const MEDIUM_GAS_THRESHOLD = "1000000";
export const HIGH_GAS_THRESHOLD = "3000000";

const getSeverity = (gasUsed: BigNumber): FindingSeverity => {
  if (gasUsed.isGreaterThanOrEqualTo(HIGH_GAS_THRESHOLD)) {
    return FindingSeverity.High;
  }
  if (gasUsed.isGreaterThanOrEqualTo(MEDIUM_GAS_THRESHOLD)) {
    return FindingSeverity.Medium;
  }
  return FindingSeverity.Unknown;
};

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];
  const gasUsed = new BigNumber(txEvent.gasUsed);

  if (gasUsed.isLessThan(MEDIUM_GAS_THRESHOLD)) {
    return findings;
  }

  findings.push(
    Finding.fromObject({
      name: "High Gas Used",
      description: `Gas Used: ${gasUsed}`,
      alertId: "NETHFORTA-1",
      severity: getSeverity(gasUsed),
      type: FindingType.Suspicious,
    })
  );

  return findings;
};

export default {
  handleTransaction,
};
