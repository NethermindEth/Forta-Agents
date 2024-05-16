import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  BlockEvent,
  FindingSeverity,
  FindingType,
  scanBase,
  scanEthereum,
  getChainId,
  runHealthCheck,
} from "forta-bot";
import { PersistenceHelper } from "./persistence.helper";
import { thresholds } from "./agent.config";

let chainId: string;

const DATABASE_URL = "https://research.forta.network/database/bot/";

const ANOMALOUS_TXNS_KEY = "nm-anomalous-value-bot-key";
const ANY_VALUE_TXNS_KEY = "nm-any-txn-value-bot-key";

let anomalousValueTxns = 0;
let allTxnsWithValue = 0;

export const provideInitialize = (
  persistenceHelper: PersistenceHelper,
  anomalousValueKey: string,
  anyValueKey: string
) => {
  return async () => {
    const chainIdValue = getChainId();

    if (chainIdValue !== undefined) {
      chainId = chainIdValue.toString();
      console.log("chain id is:", chainId);
    } else {
      console.log("chain id is undefined");
      throw new Error("Chain ID is undefined");
    }

    anomalousValueTxns = await persistenceHelper.load(anomalousValueKey.concat("-", chainId));
    allTxnsWithValue = await persistenceHelper.load(anyValueKey.concat("-", chainId));
  };
};

export const provideHandleTransaction = (thresholds: any): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const value = BigInt(txEvent.transaction.value);

    if (value > BigInt(0)) {
      allTxnsWithValue += 1;
    }

    if (value <= BigInt(thresholds[chainId])) return findings;

    anomalousValueTxns += 1;
    let anomalyScore = anomalousValueTxns / allTxnsWithValue;
    anomalyScore = Math.min(1, anomalyScore);
    findings.push(
      Finding.fromObject({
        name: "High Value Use Detection",
        description: "High value is used.",
        alertId: "NETHFORTA-2",
        severity: FindingSeverity.High,
        type: FindingType.Suspicious,
        metadata: {
          value: value.toString(),
          anomalyScore: anomalyScore.toFixed(2) === "0.00" ? anomalyScore.toString() : anomalyScore.toFixed(2),
        },
        source: {
          chains: [{ chainId: txEvent.network }],
          blocks: [{ chainId: txEvent.network, hash: txEvent.blockHash, number: txEvent.blockNumber }],
          transactions: [{ chainId: txEvent.network, hash: txEvent.hash }],
        },
        // labels: [
        //   Label.fromObject({
        //     entityType: EntityType.Transaction,
        //     entity: txEvent.hash,
        //     label: "Suspicious",
        //     confidence: 0.6,
        //     remove: false,
        //   }),
        //   Label.fromObject({
        //     entityType: EntityType.Address,
        //     entity: txEvent.from,
        //     label: "Attacker",
        //     confidence: 0.1,
        //     remove: false,
        //   }),
        // ],
      })
    );

    return findings;
  };
};

export function provideHandleBlock(
  persistenceHelper: PersistenceHelper,
  anomalousValueKey: string,
  anyValueKey: string
) {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    if (blockEvent.blockNumber % 240 === 0) {
      await persistenceHelper.persist(anomalousValueTxns, anomalousValueKey.concat("-", chainId));
      await persistenceHelper.persist(allTxnsWithValue, anyValueKey.concat("-", chainId));
    }

    return findings;
  };
}

async function main() {
  const initialize = provideInitialize(new PersistenceHelper(DATABASE_URL), ANOMALOUS_TXNS_KEY, ANY_VALUE_TXNS_KEY);
  const handleTransaction = provideHandleTransaction(thresholds);
  const handleBlock = provideHandleBlock(new PersistenceHelper(DATABASE_URL), ANOMALOUS_TXNS_KEY, ANY_VALUE_TXNS_KEY);

  await initialize();

  scanBase({
    rpcUrl: "https://base-mainnet.g.alchemy.com/v2",
    rpcKeyId: "ff890297-bee3-41a6-b985-1e68cdc78f7c",
    localRpcUrl: "8453",
    handleTransaction,
    handleBlock,
  });

  scanEthereum({
    rpcUrl: "https://eth-mainnet.g.alchemy.com/v2",
    rpcKeyId: "64286df1-4567-405a-a102-1122653022e4",
    localRpcUrl: "1",
    handleTransaction,
    handleBlock,
  });

  runHealthCheck();
}

main();
