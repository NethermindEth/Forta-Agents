import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  BlockEvent,
  FindingSeverity,
  FindingType,
  ethers,
  Label,
  EntityType,
  getEthersProvider,
  getTransactionReceipt,
  Receipt,
} from "forta-agent";
import { getCreatedContracts } from "forta-helpers";
import { PersistenceHelper } from "./persistence.helper";

let CHAIN_ID: string;

export const MEDIUM_GAS_THRESHOLD = "4000000";
export const HIGH_GAS_THRESHOLD = "6000000";

const MEDIUM_GAS_KEY = "nm-medium-gas-use-bot-key";
const HIGH_GAS_KEY = "nm-high-gas-use-bot-key";
const ALL_GAS_KEY = "nm-all-gas-use-bot-key";

const DATABASE_URL = "https://research.forta.network/database/bot/";

let medHighGasAlerts = 0;
let hiHighGasAlerts = 0;
let allHighGasAlerts = 0;

let transactionsProcessed = 0;
let lastBlock = 0;

const getSeverity = (gasUsed: ethers.BigNumber): FindingSeverity => {
  if (gasUsed.gte(HIGH_GAS_THRESHOLD)) {
    hiHighGasAlerts += 1;
    return FindingSeverity.High;
  }
  if (gasUsed.gte(MEDIUM_GAS_THRESHOLD)) {
    medHighGasAlerts += 1;
    return FindingSeverity.Medium;
  }
  return FindingSeverity.Unknown;
};

const getAnomalyScore = (gasSeverity: FindingSeverity) => {
  if (gasSeverity === FindingSeverity.High) {
    const highAnomalyScore = hiHighGasAlerts / allHighGasAlerts;
    return highAnomalyScore.toFixed(2) === "0.00" ? highAnomalyScore.toString() : highAnomalyScore.toFixed(2);
  } else if (gasSeverity === FindingSeverity.Medium) {
    const medAnomalyScore = medHighGasAlerts / allHighGasAlerts;
    return medAnomalyScore.toFixed(2) === "0.00" ? medAnomalyScore.toString() : medAnomalyScore.toFixed(2);
  } else {
    return 1;
  }
};

export function provideInitialize(
  provider: ethers.providers.Provider,
  persistenceHelper: PersistenceHelper,
  mediumGasKey: string,
  highGasKey: string,
  allGasKey: string
) {
  return async function initialize() {
    const { chainId } = await provider.getNetwork();
    CHAIN_ID = chainId.toString();
    medHighGasAlerts = await persistenceHelper.load(mediumGasKey.concat("-", CHAIN_ID));
    hiHighGasAlerts = await persistenceHelper.load(highGasKey.concat("-", CHAIN_ID));
    allHighGasAlerts = await persistenceHelper.load(allGasKey.concat("-", CHAIN_ID));
  };
}

export function provideHandleTransaction(
  getTransactionReceipt: (txHash: string) => Promise<Receipt>
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];

    if (txEvent.blockNumber != lastBlock) {
      lastBlock = txEvent.blockNumber;
      console.log(`-----Transactions processed in block ${txEvent.blockNumber - 1}: ${transactionsProcessed}-----`);
      transactionsProcessed = 0;
    }
    transactionsProcessed += 1;

    // Ignore transactions in which contracts are created
    const createdContracts = getCreatedContracts(txEvent);
    if (createdContracts.length > 0) {
      return findings;
    }

    const maxRetries = 2;
    let retryCount = 0;
    let gasUsed = ethers.BigNumber.from(0);

    while (retryCount <= maxRetries) {
      try {
        const receipt = await getTransactionReceipt(txEvent.hash);
        gasUsed = ethers.BigNumber.from(receipt.gasUsed);
        break; // if we reach this point, the operation was successful and we can exit the loop
      } catch {
        console.log(`Attempt ${retryCount + 1} to fetch transaction receipt failed`);
        if (retryCount === maxRetries) {
          throw new Error(`Failed to retrieve transaction receipt after ${maxRetries + 1} attempts`);
        }
        retryCount++;
        // wait for 1 second before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (gasUsed.lt(MEDIUM_GAS_THRESHOLD)) {
      return findings;
    }

    allHighGasAlerts += 1;
    const gasSeverity = getSeverity(gasUsed);
    const anomalyScore = getAnomalyScore(gasSeverity);

    findings.push(
      Finding.fromObject({
        name: "High Gas Use Detection",
        description: "Gas used by Transaction",
        alertId: "NETHFORTA-1",
        severity: gasSeverity,
        type: FindingType.Suspicious,
        metadata: {
          gas: gasUsed.toString(),
          anomalyScore: anomalyScore.toString(),
        },
        labels: [
          Label.fromObject({
            entityType: EntityType.Transaction,
            entity: txEvent.hash,
            label: "Suspicious",
            confidence: 0.7,
            remove: false,
          }),
          Label.fromObject({
            entityType: EntityType.Address,
            entity: txEvent.from,
            label: "Attacker",
            confidence: 0.1,
            remove: false,
          }),
        ],
      })
    );

    return findings;
  };
}

export function provideHandleBlock(
  persistenceHelper: PersistenceHelper,
  mediumGasKey: string,
  highGasKey: string,
  allGasKey: string
) {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    if (blockEvent.blockNumber % 240 === 0) {
      await persistenceHelper.persist(medHighGasAlerts, mediumGasKey.concat("-", CHAIN_ID));
      await persistenceHelper.persist(hiHighGasAlerts, highGasKey.concat("-", CHAIN_ID));
      await persistenceHelper.persist(allHighGasAlerts, allGasKey.concat("-", CHAIN_ID));
    }

    return findings;
  };
}

export default {
  initialize: provideInitialize(
    getEthersProvider(),
    new PersistenceHelper(DATABASE_URL),
    MEDIUM_GAS_KEY,
    HIGH_GAS_KEY,
    ALL_GAS_KEY
  ),
  handleTransaction: provideHandleTransaction(getTransactionReceipt),
  handleBlock: provideHandleBlock(new PersistenceHelper(DATABASE_URL), MEDIUM_GAS_KEY, HIGH_GAS_KEY, ALL_GAS_KEY),
};
