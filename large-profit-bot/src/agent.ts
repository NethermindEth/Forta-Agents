import {
  BlockEvent,
  Finding,
  FindingSeverity,
  HandleTransaction,
  Initialize,
  TransactionEvent,
  ethers,
  getEthersProvider,
} from "forta-agent";
import LRU from "lru-cache";
import { ERC20_TRANSFER_EVENT, WRAPPED_NATIVE_TOKEN_EVENTS, ZERO, createFinding, wrappedNativeTokens } from "./utils";
import Fetcher from "./fetcher";
import { keys } from "./keys";
import { EOA_TRANSACTION_COUNT_THRESHOLD } from "./config";
import { PersistenceHelper } from "./persistence.helper";

let chainId: string;

const DATABASE_URL = "https://research.forta.network/database/bot/";

const LARGE_PROFIT_TXNS_KEY = "nm-large-profit-prod-bot-txns-key";
const ALL_TXNS_KEY = "nm-large-profit-prod-bot-all-txns-key";

let largeProfitTxns = 0;
let allTxns = 0;

let transactionsProcessed = 0;
let lastBlock = 0;

const TX_COUNT_THRESHOLD = 70;

const contractsCache = new LRU<string, boolean>({
  max: 10000,
});

export const provideInitialize = (
  provider: ethers.providers.Provider,
  persistenceHelper: PersistenceHelper,
  largeProfitsTxnsKey: string,
  allTxnsKey: string
): Initialize => {
  return async () => {
    chainId = (await provider.getNetwork()).chainId.toString();

    largeProfitTxns = await persistenceHelper.load(largeProfitsTxnsKey.concat("-", chainId));
    allTxns = await persistenceHelper.load(allTxnsKey.concat("-", chainId));
  };
};

export const provideHandleTransaction =
  (fetcher: Fetcher, provider: ethers.providers.Provider): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    if (txEvent.blockNumber != lastBlock) {
      lastBlock = txEvent.blockNumber;
      console.log(`-----Transactions processed in block ${txEvent.blockNumber - 1}: ${transactionsProcessed}-----`);
      transactionsProcessed = 0;
    }
    transactionsProcessed += 1;

    if (txEvent.to) {
      let isToAnEOA: boolean = false;
      let retries = 3;
      for (let i = 0; i < retries; i++) {
        if (contractsCache.has(txEvent.to)) {
          break;
        } else {
          try {
            isToAnEOA = (await provider.getCode(txEvent.to)) === "0x";
            if (!isToAnEOA) {
              contractsCache.set(txEvent.to, true);
            }
            break;
          } catch {
            await new Promise((resolve) => setTimeout(resolve, 250));
          }
        }
      }

      if (isToAnEOA) return findings;
    }

    let txCount = EOA_TRANSACTION_COUNT_THRESHOLD + 1;
    let retries = 3;
    for (let i = 0; i < retries; i++) {
      try {
        txCount = await provider.getTransactionCount(txEvent.from);
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    if (txCount > EOA_TRANSACTION_COUNT_THRESHOLD) return findings;

    allTxns += 1;

    const balanceChangesMap: Map<string, Record<string, ethers.BigNumber>> = new Map();

    const erc20TransferEvents = txEvent.filterLog(ERC20_TRANSFER_EVENT).filter((event) => !event.args.value.eq(ZERO));
    let events = erc20TransferEvents;
    if (txEvent.network in wrappedNativeTokens) {
      const wrappedTokenEvents = txEvent
        .filterLog(WRAPPED_NATIVE_TOKEN_EVENTS, wrappedNativeTokens[txEvent.network])
        .filter((event) => !event.args.value.eq(ZERO));
      events = events.concat(wrappedTokenEvents);
    }

    await Promise.all(
      events.map(async (event) => {
        const token = event.address;
        let { from, to, value } = event.args;
        if (!from) {
          from = wrappedNativeTokens[txEvent.network];
        } else {
          from = ethers.utils.getAddress(from);
        }

        // Update the balances map for 'from'
        if (balanceChangesMap.has(from)) {
          let currentEntry = balanceChangesMap.get(from);
          currentEntry![token] = (currentEntry![token] || ZERO).sub(value);
          balanceChangesMap.set(from, currentEntry!);
        } else {
          balanceChangesMap.set(from, { [token]: value.mul(-1) });
        }

        if (!to) {
          to = wrappedNativeTokens[txEvent.network];
        } else {
          to = ethers.utils.getAddress(to);
        }

        if (balanceChangesMap.has(to)) {
          let currentEntry = balanceChangesMap.get(to);
          currentEntry![token] = (currentEntry![token] || ZERO).add(value);
          balanceChangesMap.set(to, currentEntry!);
        } else {
          balanceChangesMap.set(to, { [token]: value });
        }
      })
    );

    if (txEvent.traces.length > 0) {
      await Promise.all(
        txEvent.traces.map(async (trace) => {
          let { from, to, value, callType } = trace.action;

          if (value && value !== "0x0" && callType === "call") {
            from = ethers.utils.getAddress(from);
            to = ethers.utils.getAddress(to);
            const bnValue = ethers.BigNumber.from(value);

            // Update the native token balance for the from address
            if (balanceChangesMap.has(from)) {
              let currentEntry = balanceChangesMap.get(from);
              currentEntry!["native"] = (currentEntry!["native"] || ZERO).sub(bnValue);
              balanceChangesMap.set(from, currentEntry!);
            } else {
              balanceChangesMap.set(from, { ["native"]: bnValue.mul(-1) });
            }
            // Update the native token balance for the to address
            if (balanceChangesMap.has(to)) {
              let currentEntry = balanceChangesMap.get(to);
              currentEntry!["native"] = (currentEntry!["native"] || ZERO).add(bnValue);
              balanceChangesMap.set(to, currentEntry!);
            } else {
              balanceChangesMap.set(to, { ["native"]: bnValue });
            }
          }
        })
      );
    } else {
      if (txEvent.to && txEvent.transaction.value !== "0x0") {
        const from = ethers.utils.getAddress(txEvent.from);
        const to = ethers.utils.getAddress(txEvent.to);
        const bnValue = ethers.BigNumber.from(txEvent.transaction.value);

        // Update the native token balance for the from address
        if (balanceChangesMap.has(from)) {
          let currentEntry = balanceChangesMap.get(from);
          currentEntry!["native"] = ZERO.sub(bnValue);
          balanceChangesMap.set(from, currentEntry!);
        } else {
          balanceChangesMap.set(from, { ["native"]: bnValue.mul(-1) });
        }

        // Update the native token balance for the to address
        if (balanceChangesMap.has(to)) {
          let currentEntry = balanceChangesMap.get(to);
          currentEntry!["native"] = ZERO.add(bnValue);
          balanceChangesMap.set(to, currentEntry!);
        } else {
          balanceChangesMap.set(to, { ["native"]: bnValue });
        }
      }
    }
    // Remove empty records and filter out addresses other than txEvent.from and txEvent.to
    await Promise.all(
      Array.from(balanceChangesMap.entries()).map(async ([key, record]) => {
        Object.keys(record).forEach((token) => {
          if (record[token].eq(ZERO)) {
            delete record[token];
          }
        });
        if (
          Object.keys(record).length === 0 ||
          key === ethers.constants.AddressZero ||
          key.toLowerCase() === "0x000000000000000000000000000000000000dead"
        ) {
          balanceChangesMap.delete(key);
        }
        if (![txEvent.from.toLowerCase(), txEvent.to?.toLowerCase()].includes(key.toLowerCase())) {
          const retries = 2;
          let txCount = 0;
          for (let i = 0; i < retries; i++) {
            try {
              txCount = await provider.getTransactionCount(key);
              break;
            } catch (e) {
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }

          // Check the transaction count of the address, if it's <= 1 remove it from the map, as it is a contract
          if (txCount <= 1 || txCount > TX_COUNT_THRESHOLD) {
            balanceChangesMap.delete(key);
          }
        }
      })
    );

    const balances = new Map(balanceChangesMap);
    const balanceChangesMapUsd: Map<string, Record<string, number>> = new Map();
    // Get the USD value of the balance changes
    for (const key of balanceChangesMap.keys()) {
      const record = balanceChangesMap.get(key);
      const usdRecord: Record<string, number> = {};
      for (const token in record) {
        const UsdValue = await fetcher.getValueInUsd(
          txEvent.blockNumber,
          txEvent.network,
          record[token].toString(),
          token
        );

        usdRecord[token] = UsdValue;
      }
      balanceChangesMapUsd.set(key, usdRecord);
    }
    const largeProfitAddresses: { address: string; confidence: number; isProfitInUsd: boolean; profit: number }[] = [];

    balanceChangesMapUsd.forEach((record: Record<string, number>, address: string) => {
      const sum = Object.values(record).reduce((acc, value) => {
        return acc + value;
      }, 0);

      // If the sum of the values is more than 10000 USD, add the address to the large profit addresses list
      if (sum > 10000) {
        const confidence = fetcher.getConfidenceLevel(sum, "usdValue") as number;
        largeProfitAddresses.push({ address, confidence, isProfitInUsd: true, profit: sum });
      }
    });
    // For tokens with no USD value fetched, check if the balance change is greater than 5% of the total supply
    await Promise.all(
      Array.from(balanceChangesMapUsd.entries()).map(async ([address, record]) => {
        return Promise.all(
          Object.keys(record).map(async (token) => {
            const usdValue = record[token];
            if (usdValue === 0 && token !== "native") {
              // Filter out token mints from new token contracts
              if (!txEvent.to) {
                const nonce = txEvent.transaction.nonce;
                const createdContractAddress = ethers.utils.getContractAddress({ from: txEvent.from, nonce: nonce });
                if (token === createdContractAddress.toLowerCase()) {
                  return;
                }
                // Filter out token transfers to the token contract itself
              } else if (txEvent.to.toLowerCase() === token) {
                return;
              }

              const value = balances.get(address);
              if (!value![token].isNegative()) {
                const totalSupply = await fetcher.getTotalSupply(txEvent.blockNumber, token);
                const threshold = totalSupply.div(20); // 5%
                const absValue = value![token];
                if (absValue.gt(threshold)) {
                  // Filter out token mints (e.g. Uniswap LPs) to contract creators
                  const wasTokenCreatedByInitiator = await fetcher.getContractCreator(token, Number(txEvent.network));
                  if (wasTokenCreatedByInitiator === txEvent.from.toLowerCase()) {
                    return;
                  }
                  let percentage: number;
                  try {
                    percentage = Math.min(absValue.mul(100).div(totalSupply).toNumber(), 100);
                  } catch (err) {
                    if (err instanceof Error) {
                      if (err.message.startsWith("overflow")) {
                        percentage = 100;
                      } else {
                        percentage = 0;
                      }
                    } else {
                      percentage = 0;
                    }
                  }
                  const confidence = fetcher.getConfidenceLevel(percentage, "totalSupply") as number;
                  largeProfitAddresses.push({ address, confidence, isProfitInUsd: false, profit: percentage });
                }
              }
            }
          })
        );
      })
    );
    if (!(largeProfitAddresses.length > 0)) {
      return findings;
    }

    // Filter out duplicate addresses, keeping the entry with the higher confidence level
    const filteredLargeProfitAddresses = largeProfitAddresses.reduce(
      (acc: { address: string; confidence: number; isProfitInUsd: boolean; profit: number }[], curr) => {
        const existingIndex = acc.findIndex(
          (item: { address: string; confidence: number; isProfitInUsd: boolean; profit: number }) =>
            item.address === curr.address
        );
        if (existingIndex === -1) {
          acc.push(curr);
        } else if (acc[existingIndex].confidence < curr.confidence) {
          acc[existingIndex].confidence = curr.confidence;
        }
        return acc;
      },
      []
    );

    let wasCalledContractCreatedByInitiator = false;
    if (!txEvent.to) {
      largeProfitTxns += 1;
      const anomalyScore = largeProfitTxns / allTxns;
      findings.push(
        createFinding(
          filteredLargeProfitAddresses,
          txEvent.hash,
          FindingSeverity.Medium,
          txEvent.from,
          "",
          anomalyScore
        )
      );
    } else {
      wasCalledContractCreatedByInitiator =
        (await fetcher.getContractCreator(txEvent.to, Number(txEvent.network))) === txEvent.from.toLowerCase();
      if (wasCalledContractCreatedByInitiator) {
        largeProfitTxns += 1;
        const anomalyScore = largeProfitTxns / allTxns;
        findings.push(
          createFinding(
            filteredLargeProfitAddresses,
            txEvent.hash,
            FindingSeverity.Medium,
            txEvent.from,
            txEvent.to,
            anomalyScore
          )
        );
      } else {
        await Promise.all(
          filteredLargeProfitAddresses.map(async (entry) => {
            if (entry.address.toLowerCase() === txEvent.from.toLowerCase()) {
              const [isFirstInteraction, hasHighNumberOfTotalTxs] = await fetcher.getContractInfo(
                txEvent.to!,
                txEvent.from,
                Number(txEvent.network)
              );
              if (isFirstInteraction) {
                largeProfitTxns += 1;
                const anomalyScore = largeProfitTxns / allTxns;
                findings.push(
                  createFinding(
                    filteredLargeProfitAddresses,
                    txEvent.hash,
                    FindingSeverity.Medium,
                    txEvent.from,
                    txEvent.to!,
                    anomalyScore
                  )
                );
              } else {
                const isVerified = await fetcher.isContractVerified(txEvent.to!, Number(txEvent.network));
                if (!isVerified && !hasHighNumberOfTotalTxs) {
                  largeProfitTxns += 1;
                  const anomalyScore = largeProfitTxns / allTxns;
                  findings.push(
                    createFinding(
                      filteredLargeProfitAddresses,
                      txEvent.hash,
                      FindingSeverity.Medium,
                      txEvent.from,
                      txEvent.to!,
                      anomalyScore
                    )
                  );
                  // If one of the booleans is true, the severity is set to Info
                } else if (isVerified !== hasHighNumberOfTotalTxs) {
                  largeProfitTxns += 1;
                  const anomalyScore = largeProfitTxns / allTxns;
                  findings.push(
                    createFinding(
                      filteredLargeProfitAddresses,
                      txEvent.hash,
                      FindingSeverity.Info,
                      txEvent.from,
                      txEvent.to!,
                      anomalyScore
                    )
                  );
                } else return;
              }
            }
          })
        );
      }
    }

    return findings;
  };

export function provideHandleBlock(persistenceHelper: PersistenceHelper, largeProfitKey: string, allTxnsKey: string) {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    if (blockEvent.blockNumber % 240 === 0) {
      await persistenceHelper.persist(largeProfitTxns, largeProfitKey.concat("-", chainId));
      await persistenceHelper.persist(allTxns, allTxnsKey.concat("-", chainId));
    }

    return findings;
  };
}

export default {
  initialize: provideInitialize(
    getEthersProvider(),
    new PersistenceHelper(DATABASE_URL),
    LARGE_PROFIT_TXNS_KEY,
    ALL_TXNS_KEY
  ),
  provideInitialize,
  handleTransaction: provideHandleTransaction(new Fetcher(getEthersProvider(), keys), getEthersProvider()),
  provideHandleTransaction,
  handleBlock: provideHandleBlock(new PersistenceHelper(DATABASE_URL), LARGE_PROFIT_TXNS_KEY, ALL_TXNS_KEY),
};
