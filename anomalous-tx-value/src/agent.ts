import BigNumber from "bignumber.js";
import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType
} from "forta-agent";

export const DECIMALS = 10 ** 18;
export const TX_VALUE_THRESHOLD = 100 * DECIMALS;

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  // create finding if ETH value is higher than threshold
  const value = new BigNumber(txEvent.transaction.value);

  if (value.isLessThanOrEqualTo(TX_VALUE_THRESHOLD)) return findings;

  if (value.isGreaterThan(TX_VALUE_THRESHOLD)) {
    findings.push(
      Finding.fromObject({
        name: "High Value Use Detection",
        description: "High value is used.",
        alertId: "NETHFORTA-2",
        severity: FindingSeverity.High,
        type: FindingType.Suspicious,
        metadata: {
          value: value.toString()
        }
      })
    );
  }

  return findings;
};

export default {
  handleTransaction
};
