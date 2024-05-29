import {
  Finding,
  HandleTransaction,
  HandleBlock,
  TransactionEvent,
  BlockEvent,
  FindingSeverity,
  FindingType,
  Label,
  EntityType,
  scanEthereum,
  getChainId,
  runHealthCheck,
  ethers,
  Initialize,
} from "@fortanetwork/forta-bot";

import { PersistenceHelper } from "./persistence.helper";

const DATABASE_URL = "https://research.forta.network/database/bot/";

const NONZERO_OWNERSHIP_TRANSFER_KEY = "nm-nonzero-ownership-transfers-bot-filecoin-key";
const TOTAL_OWNERSHIP_TRANSFERS_KEY = "nm-total-ownership-transfers-bot-filecoin-key";

let chainId: string;
let nonZeroOwnershipTransfers = 0;
let totalOwnersipTransfers = 0;

export const provideInitialize = (
  persistenceHelper: PersistenceHelper,
  nonZeroOwnershipTransferKey: string,
  totalOwnershipTransfersKey: string
): Initialize => {
  return async () => {
    const chainIdNum = getChainId()!
    chainId = String(chainIdNum);

    nonZeroOwnershipTransfers = await persistenceHelper.load(nonZeroOwnershipTransferKey.concat("-", chainId));
    totalOwnersipTransfers = await persistenceHelper.load(totalOwnershipTransfersKey.concat("-", chainId));
  };
};

export const OWNERSHIP_TRANSFERRED_ABI: string =
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)";

export const provideHandleTransaction = (): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const logs = txEvent.filterLog(OWNERSHIP_TRANSFERRED_ABI);

    await Promise.all(
      logs.map(async (log) => {
        totalOwnersipTransfers++;

        if (ethers.ZeroAddress != log.args.previousOwner) {
          nonZeroOwnershipTransfers++;
          const anomalyScore = nonZeroOwnershipTransfers / totalOwnersipTransfers;

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
                  label: "Attack",
                  confidence: 0.6,
                  remove: false,
                }),
                Label.fromObject({
                  entity: txEvent.from,
                  entityType: EntityType.Address,
                  label: "Attacker",
                  confidence: 0.6,
                  remove: false,
                }),
                Label.fromObject({
                  entity: log.args.previousOwner,
                  entityType: EntityType.Address,
                  label: "Victim",
                  confidence: 0.6,
                  remove: false,
                }),
                Label.fromObject({
                  entity: log.args.newOwner,
                  entityType: EntityType.Address,
                  label: "Attacker",
                  confidence: 0.6,
                  remove: false,
                }),
              ],
              source: {
                chains: [{ chainId: txEvent.network }],
                transactions: [{ chainId: txEvent.network, hash: txEvent.hash }],
              },
            })
          );
        }
      })
    );

    return findings;
  };
};

export const provideHandleBlock = (
  persistenceHelper: PersistenceHelper,
  nonZeroOwnershipTransferKey: string,
  totalOwnershipTransfersKey: string
): HandleBlock => {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    if (blockEvent.blockNumber % 240 === 0) {
      await persistenceHelper.persist(nonZeroOwnershipTransfers, nonZeroOwnershipTransferKey.concat("-", chainId));
      await persistenceHelper.persist(totalOwnersipTransfers, totalOwnershipTransfersKey.concat("-", chainId));
    }

    return findings;
  };
}

async function main() {
  const initialize = provideInitialize(
    new PersistenceHelper(DATABASE_URL),
    NONZERO_OWNERSHIP_TRANSFER_KEY,
    TOTAL_OWNERSHIP_TRANSFERS_KEY
  );
  const handleTransaction = provideHandleTransaction();
  const handleBlock = provideHandleBlock(
    new PersistenceHelper(DATABASE_URL),
    NONZERO_OWNERSHIP_TRANSFER_KEY,
    TOTAL_OWNERSHIP_TRANSFERS_KEY
  );

  await initialize();

  // Using in lieu of `scanFilecoin`
  scanEthereum({
    rpcUrl: "https://rpc.ankr.com/filecoin",
    localRpcUrl: "314",
    handleTransaction,
    handleBlock
  });

  runHealthCheck();
}

if (require.main === module) {
  main();
}