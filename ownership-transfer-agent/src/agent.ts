import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  Label,
  EntityType,
  getEthersProvider,
  ethers,
  Initialize,
} from "forta-agent";

import calculateAlertRate, { ScanCountType } from "bot-alert-rate";
import { ZETTABLOCK_API_KEY } from "./keys";

const BOT_ID = "0x7704a975c97ed444c0329cade1f85af74566d30fb6a51550529b19153a0781cb";

let chainId: string;
let isRelevantChain: boolean;
let txCount = 0;

export const provideInitialize = (provider: ethers.providers.Provider): Initialize => {
  return async () => {
    process.env["ZETTABLOCK_API_KEY"] = ZETTABLOCK_API_KEY;
    chainId = (await provider.getNetwork()).chainId.toString();

    //  Optimism, Fantom & Avalanche not yet supported by bot-alert-rate package
    isRelevantChain = [10, 250, 43114].includes(Number(chainId));
  };
};

export const OWNERSHIP_TRANSFERRED_ABI: string =
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)";

export const provideHandleTransaction = (): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const logs = txEvent.filterLog(OWNERSHIP_TRANSFERRED_ABI);

    if (isRelevantChain) txCount++;

    await Promise.all(
      logs.map(async (log) => {
        if (ethers.constants.AddressZero != log.args.previousOwner) {
          const anomalyScore = await calculateAlertRate(
            Number(chainId),
            BOT_ID,
            "NETHFORTA-4",
            isRelevantChain ? ScanCountType.CustomScanCount : ScanCountType.TxCount,
            txCount
          );

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
                anomalyScore: anomalyScore.toString(),
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
      })
    );

    return findings;
  };
};

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(),
};
