import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType, ethers } from "forta-agent";
import { isZeroAddress } from "ethereumjs-util";

export const OWNERSHIP_TRANSFERRED_ABI: string =
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)";

export const provideHandleTransaction = (): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const logs = txEvent.filterLog(OWNERSHIP_TRANSFERRED_ABI);

    logs.map(async (log) => {
      if (!isZeroAddress(log.args.previousOwner)) {
        findings.push(
          Finding.fromObject({
            name: "Ownership Transfer Detection",
            description: "The ownership transfer is detected.",
            alertId: "NETHFORTA-4",
            severity: FindingSeverity.High,
            type: FindingType.Suspicious,
            metadata: {
              from: log.args.previousOwner,
              to: log.args.newOwner,
            },
            addresses: [
              ...new Set([
                txEvent.from,
                txEvent.to,
                log.args.previousOwner.toLowerCase(),
                log.args.newOwner.toLowerCase(),
              ]),
            ],
          })
        );
      }
    });

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(),
};
