import { BigNumber } from "ethers";
import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  LogDescription,
  TransactionEvent,
} from "forta-agent";
import { DELEGATE_VOTES_CHANGED_ABI, PERCENTAGE_THRESHOLD, QI_ADDRESS } from "./constants";

const isLarge = (previousBalance: BigNumber, newBalance: BigNumber, percentageThreshold: BigNumber): boolean => {
  const absoluteThreshold = previousBalance.mul(BigNumber.from(100).add(percentageThreshold));
  return newBalance.mul(100).gte(absoluteThreshold);
};

export const provideHandleTransaction = (
  contractAddress: string,
  percentageThreshold: BigNumber
): HandleTransaction => {
  const description = `There was a >= ${percentageThreshold.toString()}% increase in delegate votes based on the previous amount`;

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    txEvent.filterLog(DELEGATE_VOTES_CHANGED_ABI, contractAddress).forEach((log: LogDescription) => {
      if (isLarge(log.args.previousBalance, log.args.newBalance, percentageThreshold)) {
        findings.push(
          Finding.fromObject({
            name: "Large increase in delegate votes",
            description,
            alertId: "BENQI-1",
            severity: FindingSeverity.Info,
            type: FindingType.Info,
            protocol: "Benqi Finance",
            metadata: {
              delegate: log.args.delegate,
              previousBalance: log.args.previousBalance.toString(),
              newBalance: log.args.newBalance.toString(),
            },
          })
        );
      }
    });

    return findings;
  };
};

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(QI_ADDRESS, PERCENTAGE_THRESHOLD),
};
