import BigNumber from "bignumber.js";
import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  BlockEvent,
  FindingSeverity,
  FindingType,
  getEthersProvider,
  Initialize,
  ethers,
  Label,
  EntityType,
} from "forta-agent";
import { PersistenceHelper } from "./persistence.helper";
import { NetworkData } from "./utils";
import { providers } from "ethers";
import { NetworkManager } from "forta-agent-tools";
import CONFIG from "./agent.config";

let chainId: string;

const DATABASE_URL = "https://research.forta.network/database/bot/";

const ANOMALOUS_TXNS_KEY = "nm-anomalous-value-bot-key";
const ANY_VALUE_TXNS_KEY = "nm-any-txn-value-bot-key";

let anomalousValueTxns = 0;
let allTxnsWithValue = 0;

const networkManager = new NetworkManager<NetworkData>(CONFIG);

export const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: providers.Provider,
  persistenceHelper: PersistenceHelper,
  anomalousValueKey: string,
  anyValueKey: string
): Initialize => {
  return async () => {
    await networkManager.init(provider);
    chainId = networkManager.getNetwork().toString();

    anomalousValueTxns = await persistenceHelper.load(anomalousValueKey.concat("-", chainId));
    allTxnsWithValue = await persistenceHelper.load(anyValueKey.concat("-", chainId));
  };
};

export const provideHandleTransaction = (networkManager: NetworkManager<NetworkData>): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const value = ethers.BigNumber.from(txEvent.transaction.value);

    if (value.gt(ethers.constants.Zero)) {
      allTxnsWithValue += 1;
    }
    if (value.lte(networkManager.get("threshold"))) return findings;

    anomalousValueTxns += 1;
    const anomalyScore = (anomalousValueTxns / allTxnsWithValue).toFixed(2);
    findings.push(
      Finding.fromObject({
        name: "High Value Use Detection",
        description: "High value is used.",
        alertId: "NETHFORTA-2",
        severity: FindingSeverity.High,
        type: FindingType.Suspicious,
        metadata: {
          value: value.toString(),
          anomalyScore: anomalyScore.toString(),
        },
        labels: [
          Label.fromObject({
            entityType: EntityType.Transaction,
            entity: txEvent.hash,
            label: "High Gas Transaction",
            confidence: 1,
          }),
        ],
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

export default {
  initialize: provideInitialize(
    networkManager,
    getEthersProvider(),
    new PersistenceHelper(DATABASE_URL),
    ANOMALOUS_TXNS_KEY,
    ANY_VALUE_TXNS_KEY
  ),
  handleTransaction: provideHandleTransaction(networkManager),
  handleBlock: provideHandleBlock(new PersistenceHelper(DATABASE_URL), ANOMALOUS_TXNS_KEY, ANY_VALUE_TXNS_KEY),
};
