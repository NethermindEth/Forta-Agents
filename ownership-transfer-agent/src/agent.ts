import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  Label,
  EntityType,
} from "forta-agent";
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
            labels: [
              Label.fromObject({
                entity: txEvent.transaction.hash,
                entityType: EntityType.Transaction,
                label: "Ownership Transfer",
                confidence: 0.6,
                remove: false,
              }),
              Label.fromObject({
                entity: txEvent.from,
                entityType: EntityType.Address,
                label: "Initiator",
                confidence: 0.6,
                remove: false,
              }),
              Label.fromObject({
                entity: log.args.previousOwner,
                entityType: EntityType.Address,
                label: "Previous Owner",
                confidence: 0.6,
                remove: false,
              }),
              Label.fromObject({
                entity: log.args.newOwner,
                entityType: EntityType.Address,
                label: "New Owner",
                confidence: 0.6,
                remove: false,
              }),
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
