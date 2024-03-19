import {
  Finding,
  FindingSeverity,
  HandleTransaction,
  Initialize,
  TransactionEvent,
  ethers,
  getEthersProvider,
} from "forta-agent";
import LRU from "lru-cache";
import {
  ERC20_TRANSFER_EVENT,
  LOAN_CREATED_ABI,
  LargeProfitAddress,
  WRAPPED_NATIVE_TOKEN_EVENTS,
  ZERO,
  createFinding,
  nftCollateralizedLendingProtocols,
  wrappedNativeTokens,
  FUNCTION_ABIS,
  EVENTS_ABIS,
  filterAddressesInTracesUnsupportedChains,
  GNOSIS_PROXY_EVENT_ABI,
  updateBalanceChangesMap,
  filteredOutAddressesSet,
  isBatchTransfer,
} from "./utils";
import Fetcher, { ApiKeys } from "./fetcher";
import { EOA_TRANSACTION_COUNT_THRESHOLD } from "./config";
import { getSecrets } from "./storage";

let transactionsProcessed = 0;
let lastBlock = 0;
let fetcher: Fetcher;

const TX_COUNT_THRESHOLD = 70;
const MAX_RETRIES = 3;

const contractsCache = new LRU<string, boolean>({
  max: 10000,
});

export async function createNewFetcher(provider: ethers.providers.JsonRpcProvider): Promise<Fetcher> {
  const apiKeys = (await getSecrets()) as ApiKeys;
  return new Fetcher(provider, apiKeys);
}

export function provideInitialize(
  provider: ethers.providers.JsonRpcProvider,
  fetcherCreator: (provider: ethers.providers.JsonRpcProvider) => Promise<Fetcher>
): Initialize {
  return async () => {
    fetcher = await fetcherCreator(provider);
  };
}

export const provideHandleTransaction =
  (provider: ethers.providers.Provider): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    if (txEvent.blockNumber != lastBlock) {
      lastBlock = txEvent.blockNumber;
      console.log(`-----Transactions processed in block ${txEvent.blockNumber - 1}: ${transactionsProcessed}-----`);
      transactionsProcessed = 0;
    }
    transactionsProcessed += 1;

    const erc20TransferEvents = txEvent
      .filterLog(ERC20_TRANSFER_EVENT)
      .filter((event) => !event.args.value.eq(ZERO) && event.args.from !== event.args.to);

    // return if it's a single transfer or swap, or if all events are about the same token
    if (
      erc20TransferEvents.length < 3 ||
      erc20TransferEvents.every((event) => event.address === erc20TransferEvents[0].address)
    )
      return findings;

    if (isBatchTransfer(erc20TransferEvents)) return findings;

    // Filter out FPs
    const loanCreatedEvents = txEvent.filterLog(LOAN_CREATED_ABI);
    const gnosisProxyEvents = txEvent.filterLog(GNOSIS_PROXY_EVENT_ABI);
    if (loanCreatedEvents.length > 0 || gnosisProxyEvents.length > 0) {
      return findings;
    }

    let wasCalledContractCreatedByInitiator: boolean | undefined;
    if (txEvent.to) {
      if (
        nftCollateralizedLendingProtocols[txEvent.network] &&
        nftCollateralizedLendingProtocols[txEvent.network].includes(txEvent.to.toLowerCase())
      ) {
        return findings;
      }
      if (filteredOutAddressesSet.has(txEvent.to.toLowerCase())) {
        return findings;
      }
      let isToAnEOA: boolean = false;
      for (let i = 0; i < MAX_RETRIES; i++) {
        if (contractsCache.has(txEvent.to)) {
          break;
        } else {
          try {
            isToAnEOA = (await provider.getCode(txEvent.to, txEvent.blockNumber - 1)) === "0x";
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

      if (txEvent.filterFunction(FUNCTION_ABIS).length || txEvent.filterLog(EVENTS_ABIS).length) {
        if (erc20TransferEvents.length < 5) return findings;
        wasCalledContractCreatedByInitiator = await fetcher.isContractCreatedByInitiator(
          txEvent.to,
          txEvent.from,
          txEvent.blockNumber,
          Number(txEvent.network)
        );
        if (!wasCalledContractCreatedByInitiator) return findings;
      }
    }

    let txCount = EOA_TRANSACTION_COUNT_THRESHOLD + 1;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        txCount = await provider.getTransactionCount(txEvent.from, txEvent.blockNumber);
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    if (txCount > EOA_TRANSACTION_COUNT_THRESHOLD) return findings;

    const balanceChangesMap: Map<string, Record<string, ethers.BigNumber>> = new Map();

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

        updateBalanceChangesMap(balanceChangesMap, from, token, value.mul(-1));

        if (!to) {
          to = wrappedNativeTokens[txEvent.network];
        } else {
          to = ethers.utils.getAddress(to);
        }

        updateBalanceChangesMap(balanceChangesMap, to, token, value);
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

            updateBalanceChangesMap(balanceChangesMap, from, "native", bnValue.mul(-1));
            updateBalanceChangesMap(balanceChangesMap, to, "native", bnValue);
          }
        })
      );
    } else {
      if (txEvent.to && txEvent.transaction.value !== "0x0") {
        const from = ethers.utils.getAddress(txEvent.from);
        const to = ethers.utils.getAddress(txEvent.to);
        const bnValue = ethers.BigNumber.from(txEvent.transaction.value);

        updateBalanceChangesMap(balanceChangesMap, from, "native", bnValue.mul(-1));
        updateBalanceChangesMap(balanceChangesMap, to, "native", bnValue);
      }
    }

    if (txEvent.to && wasCalledContractCreatedByInitiator === undefined) {
      wasCalledContractCreatedByInitiator = await fetcher.isContractCreatedByInitiator(
        txEvent.to!,
        txEvent.from,
        txEvent.blockNumber,
        Number(txEvent.network)
      );
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
        } else if (![txEvent.from.toLowerCase(), txEvent.to?.toLowerCase()].includes(key.toLowerCase())) {
          const retries = 2;
          let txCount = 0;
          for (let i = 0; i < retries; i++) {
            try {
              txCount = await provider.getTransactionCount(key, txEvent.blockNumber);
              break;
            } catch (e) {
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }

          // Check the transaction count of the address, removing contracts and high nonce EOAs from the map
          if (txCount > TX_COUNT_THRESHOLD) {
            balanceChangesMap.delete(key);
          } else if (txCount <= 1) {
            let isEOA: boolean = false;

            for (let i = 0; i < MAX_RETRIES; i++) {
              try {
                isEOA = (await provider.getCode(key, txEvent.blockNumber)) === "0x";
                if (!isEOA) {
                  if (!wasCalledContractCreatedByInitiator) {
                    balanceChangesMap.delete(key);
                  } else {
                    // Keep only contracts directly created by the called contract
                    let conditionMet = false;

                    // Check each trace to see if it meets the condition
                    txEvent.traces.forEach((trace) => {
                      if (trace.type === "create" && trace.result.address === key.toLowerCase()) {
                        if (trace.action.from !== txEvent.to?.toLowerCase()) {
                          balanceChangesMap.delete(key);
                        } else {
                          conditionMet = true;
                        }
                      }
                    });

                    // If the condition was never met (i.e., false for all traces), delete the key
                    if (!conditionMet) {
                      balanceChangesMap.delete(key);
                    }
                  }
                }
                break;
              } catch {
                await new Promise((resolve) => setTimeout(resolve, 250));
              }
            }
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
    const largeProfitAddresses: LargeProfitAddress[] = [];
    balanceChangesMapUsd.forEach((record: Record<string, number>, address: string) => {
      const sum = Object.values(record).reduce((acc, value) => {
        return acc + value;
      }, 0);

      const hasZeroValue = Object.entries(record).some(([key, value]) => {
        const correspondingValue = balanceChangesMap.get(address)?.[key];
        return value === 0 && correspondingValue && correspondingValue.lt(0);
      });

      // If the sum of the values is more than 10000 USD and, there's no token with an unknown price and a negative sign, add the address to the large profit addresses list
      if (sum > 10000 && !hasZeroValue) {
        const [confidence, anomalyScore] = fetcher.getCLandAS(sum, "usdValue") as number[];
        largeProfitAddresses.push({ address, confidence, anomalyScore, isProfitInUsd: true, profit: sum });
      }
    });

    // For tokens with no USD value fetched, check if the balance change is greater than 5% of the total supply (only in the case of an initiator not sending other tokens away)
    await Promise.all(
      Array.from(balanceChangesMapUsd.entries()).map(async ([address, record]) => {
        const balanceChanges = balances.get(address);
        // Check if "balanceChanges" has more than one key (token) for the current address
        if (Object.keys(balanceChanges!).length > 1) {
          return;
        }

        const token = Object.keys(record)[0];
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

          if (!balanceChanges![token].isNegative()) {
            const totalSupply = await fetcher.getTotalSupply(txEvent.blockNumber, token);
            const threshold = totalSupply.div(20); // 5%
            const absValue = balanceChanges![token];
            if (absValue.gt(threshold)) {
              // Filter out token mints (e.g. Uniswap LPs) to contract creators
              const { contractCreator: tokenCreator } = await fetcher.getContractCreationInfo(
                token,
                Number(txEvent.network)
              );
              if (!tokenCreator || tokenCreator === txEvent.from.toLowerCase()) {
                return;
              }

              // Filter out tokens with <100 holders
              if (!(await fetcher.hasHighNumberOfHolders(Number(txEvent.network), token))) {
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
              const [confidence, anomalyScore] = fetcher.getCLandAS(percentage, "totalSupply") as number[];
              largeProfitAddresses.push({
                address,
                confidence,
                anomalyScore,
                isProfitInUsd: false,
                profit: percentage,
              });
            }
          }
        }
      })
    );

    if (!(largeProfitAddresses.length > 0)) {
      return findings;
    }

    // Filter out duplicate addresses, keeping the entry with the higher confidence level
    const filteredLargeProfitAddressesTemp = largeProfitAddresses.reduce((acc: LargeProfitAddress[], curr) => {
      const existingIndex = acc.findIndex((item: LargeProfitAddress) => item.address === curr.address);
      if (existingIndex === -1) {
        acc.push(curr);
      } else if (acc[existingIndex].confidence < curr.confidence) {
        acc[existingIndex].confidence = curr.confidence;
        acc[existingIndex].anomalyScore = curr.anomalyScore;
      }
      return acc;
    }, []);

    // Filters out addresses on chains lacking trace support,
    // specifically when their profit solely originates from native transfers (reflected in tx.value)
    const filteredLargeProfitAddresses = filterAddressesInTracesUnsupportedChains(
      filteredLargeProfitAddressesTemp,
      balanceChangesMapUsd,
      txEvent
    );

    if (!txEvent.to) {
      findings.push(
        createFinding(filteredLargeProfitAddresses, txEvent.hash, FindingSeverity.Medium, txEvent.from, "")
      );
    } else {
      if (wasCalledContractCreatedByInitiator) {
        const fromRecord = balanceChangesMapUsd.get(ethers.utils.getAddress(txEvent.from));
        const toRecord = balanceChangesMapUsd.get(ethers.utils.getAddress(txEvent.to));

        const fromSum = fromRecord ? Object.values(fromRecord).reduce((acc, value) => acc + value, 0) : 0;
        const toSum = toRecord ? Object.values(toRecord).reduce((acc, value) => acc + value, 0) : 0;

        // Create a finding only if the funds are not removed from either txEvent.from or txEvent.to (except if it's a very small amount)
        if (fromSum >= -500 && toSum >= -500) {
          findings.push(
            createFinding(filteredLargeProfitAddresses, txEvent.hash, FindingSeverity.Medium, txEvent.from, txEvent.to)
          );
        }
      } else {
        await Promise.all(
          filteredLargeProfitAddresses.map(async (entry) => {
            if (entry.address.toLowerCase() === txEvent.from.toLowerCase()) {
              const [isFirstInteraction, hasHighNumberOfTotalTxs] = await fetcher.getContractInfo(
                txEvent.to!,
                txEvent.from,
                txEvent.blockNumber,
                Number(txEvent.network)
              );
              if (isFirstInteraction) {
                findings.push(
                  createFinding(
                    filteredLargeProfitAddresses,
                    txEvent.hash,
                    FindingSeverity.Medium,
                    txEvent.from,
                    txEvent.to!
                  )
                );
              } else {
                const isVerified = await fetcher.isContractVerified(txEvent.to!, Number(txEvent.network));
                if (!isVerified && !hasHighNumberOfTotalTxs) {
                  findings.push(
                    createFinding(
                      filteredLargeProfitAddresses,
                      txEvent.hash,
                      FindingSeverity.Medium,
                      txEvent.from,
                      txEvent.to!
                    )
                  );
                  // If one of the booleans is true, the severity is set to Info
                } else if (isVerified !== hasHighNumberOfTotalTxs) {
                  findings.push(
                    createFinding(
                      filteredLargeProfitAddresses,
                      txEvent.hash,
                      FindingSeverity.Info,
                      txEvent.from,
                      txEvent.to!
                    )
                  );
                }
              }
            }
          })
        );
      }
    }

    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(getEthersProvider()),
  provideHandleTransaction,
  initialize: provideInitialize(getEthersProvider(), createNewFetcher),
};
