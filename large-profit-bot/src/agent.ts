import {
  Finding,
  FindingSeverity,
  HandleTransaction,
  Initialize,
  Trace,
  TransactionEvent,
  ethers,
  getEthersProvider,
} from "forta-agent";
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
  hasMatchingTokenTransfer,
  GEARBOX_CREDIT_FACADE_EVENT_ABI,
  EXECUTE_FUNCTION_ABI,
  NFT_TRANSFER_EVENTS,
  SWAP_SELECTORS,
  CONVEX_WITHDRAW_LOCKED_AND_UNWRAP_SELECTOR,
  METIS_TOKEN_BSC,
  INSTADAPP_CAST_EVENT,
} from "./utils";
import Fetcher, { ApiKeys } from "./fetcher";
import { EOA_TRANSACTION_COUNT_THRESHOLD } from "./config";
import { getSecrets } from "./storage";

let transactionsProcessed = 0;
let lastBlock = 0;
let newEOAs: string[] = [];
let fetcher: Fetcher;

const TX_COUNT_THRESHOLD = 70;
const MAX_RETRIES = 3;

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

    let events = erc20TransferEvents;
    if (txEvent.network in wrappedNativeTokens) {
      const wrappedTokenEvents = txEvent
        .filterLog(WRAPPED_NATIVE_TOKEN_EVENTS, wrappedNativeTokens[txEvent.network])
        .filter((event) => !event.args.value.eq(ZERO));
      events = events.concat(wrappedTokenEvents);
    }

    // return if it's a single transfer or swap, or if all events are about the same token
    if (
      events.length < 3 ||
      (erc20TransferEvents.every((event) => event.address === erc20TransferEvents[0].address) &&
        !erc20TransferEvents.every((event) => event.args.to === erc20TransferEvents[0].args.to))
    )
      return findings;

    if (await isBatchTransfer(erc20TransferEvents, provider)) return findings;

    // Filter out FPs
    const loanCreatedEvents = txEvent.filterLog(LOAN_CREATED_ABI);
    const gnosisProxyEvents = txEvent.filterLog(GNOSIS_PROXY_EVENT_ABI);
    const gearboxMulticallEvents = txEvent.filterLog(GEARBOX_CREDIT_FACADE_EVENT_ABI);
    const instadappCastEvents = txEvent.filterLog(INSTADAPP_CAST_EVENT);
    const executeFunctionInvocations = txEvent.filterFunction(EXECUTE_FUNCTION_ABI);
    const IsSwapExactETHForTokensInvocation = SWAP_SELECTORS.some((selector) =>
      txEvent.transaction.data.startsWith(selector)
    );
    const IsConvexWithdrawLockedAndUnwrapInvocation = txEvent.transaction.data.startsWith(
      CONVEX_WITHDRAW_LOCKED_AND_UNWRAP_SELECTOR
    );
    const IsMetisTokenInvolved =
      txEvent.network === 56 && erc20TransferEvents.some((event) => event.address === METIS_TOKEN_BSC); // Wrong price retrieved
    if (
      loanCreatedEvents.length > 0 ||
      gnosisProxyEvents.length > 0 ||
      instadappCastEvents.length > 0 ||
      gearboxMulticallEvents.length > 0 ||
      executeFunctionInvocations.length > 0 ||
      IsSwapExactETHForTokensInvocation ||
      IsConvexWithdrawLockedAndUnwrapInvocation ||
      IsMetisTokenInvolved
    ) {
      return findings;
    }

    let wasCalledContractCreatedByInitiator: boolean | undefined;
    if (txEvent.to) {
      if (txEvent.to === txEvent.from) {
        return findings;
      }
      if (
        nftCollateralizedLendingProtocols[txEvent.network] &&
        nftCollateralizedLendingProtocols[txEvent.network].includes(txEvent.to.toLowerCase())
      ) {
        return findings;
      }
      if (filteredOutAddressesSet.has(txEvent.to.toLowerCase())) {
        return findings;
      }

      if (txEvent.filterFunction(FUNCTION_ABIS).length || txEvent.filterLog(EVENTS_ABIS).length) {
        if (erc20TransferEvents.length < 5) return findings;
        wasCalledContractCreatedByInitiator = (
          await fetcher.isContractCreatedByInitiator(
            txEvent.to,
            txEvent.from,
            txEvent.blockNumber,
            Number(txEvent.network)
          )
        )[0];
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
        txEvent.traces.map(async (trace: Trace) => {
          let { from, to, value, callType, init } = trace.action;

          if (value && value !== "0x0" && (callType === "call" || init != undefined)) {
            from = ethers.utils.getAddress(from);
            to = callType === "call" ? ethers.utils.getAddress(to) : ethers.utils.getAddress(trace.result.address);
            const bnValue = ethers.BigNumber.from(value);

            updateBalanceChangesMap(balanceChangesMap, from, "native", bnValue.mul(-1));
            updateBalanceChangesMap(balanceChangesMap, to, "native", bnValue);
          }
        })
      );
    } else {
      if (txEvent.to && txEvent.transaction.value !== "0x0") {
        const from = ethers.utils.getAddress(txEvent.from);
        const to = ethers.utils.getAddress(txEvent.to!);
        const bnValue = ethers.BigNumber.from(txEvent.transaction.value);

        updateBalanceChangesMap(balanceChangesMap, from, "native", bnValue.mul(-1));
        updateBalanceChangesMap(balanceChangesMap, to, "native", bnValue);
      }
    }

    if (txEvent.to && wasCalledContractCreatedByInitiator === undefined) {
      wasCalledContractCreatedByInitiator = (
        await fetcher.isContractCreatedByInitiator(
          txEvent.to!,
          txEvent.from,
          txEvent.blockNumber,
          Number(txEvent.network)
        )
      )[txEvent.to!];
      if (wasCalledContractCreatedByInitiator === undefined) return findings;
    }

    const contractsToCheck: string[] = [];
    const contractToKeyMap: { [contract: string]: string[] } = {};

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
          let txCount = 10000;
          for (let i = 0; i < retries; i++) {
            try {
              txCount = await provider.getTransactionCount(key, txEvent.blockNumber - 100);
              break;
            } catch (e) {
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }

          // Check the transaction count of the address, removing contracts and high nonce EOAs from the map
          if (txCount > TX_COUNT_THRESHOLD) {
            balanceChangesMap.delete(key);
          } else if (txCount <= 3) {
            let isEOA: boolean = false;

            for (let i = 0; i < MAX_RETRIES; i++) {
              try {
                isEOA = (await provider.getCode(key, txEvent.blockNumber)) === "0x";
                if (!isEOA) {
                  if (!wasCalledContractCreatedByInitiator) {
                    balanceChangesMap.delete(key);
                  } else {
                    // Add the contract to the list of contracts to check
                    contractsToCheck.push(key);
                    if (!contractToKeyMap[key]) {
                      contractToKeyMap[key] = [];
                    }
                    contractToKeyMap[key].push(key);
                  }
                } else {
                  if (txCount === 0) newEOAs.push(key);
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

    // Batch the calls to isContractCreatedByInitiator
    const creationResults = await fetcher.isContractCreatedByInitiator(
      contractsToCheck,
      txEvent.from,
      txEvent.blockNumber,
      Number(txEvent.network)
    );

    // Process the results and update balanceChangesMap
    contractsToCheck.forEach((contract) => {
      const keys = contractToKeyMap[contract];
      const wasCreatedByInitiator = creationResults[contract];

      keys.forEach((key) => {
        if (!wasCreatedByInitiator) {
          // Check each trace to see if it meets the condition
          let conditionMet = false;
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
      });
    });
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
    let largeProfitAddresses: LargeProfitAddress[] = [];
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
          } else if (txEvent.to.toLowerCase() === token || address.toLowerCase() === token) {
            return;
          }

          if (!balanceChanges![token].isNegative()) {
            const totalSupply = await fetcher.getTotalSupply(txEvent.blockNumber, token, 2);
            const threshold = totalSupply.div(20); // 5%
            const absValue = balanceChanges![token];
            if (absValue.gt(threshold)) {
              // Filter out token mints (e.g. Uniswap LPs) to contract creators
              const { contractCreator: tokenCreator } = (
                await fetcher.getContractCreationInfo(token, Number(txEvent.network))
              )[0];
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
    // Filter out largeProfitAddresses that have sent NFTs in the transaction
    const nftTransferEvents = txEvent.filterLog(NFT_TRANSFER_EVENTS);
    if (nftTransferEvents.length) {
      const nftSenders = new Set(nftTransferEvents.map((event) => event.args.from));
      largeProfitAddresses = largeProfitAddresses.filter((address) => !nftSenders.has(address.address));
    }

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
      const totalSupply = await fetcher.getTotalSupply(txEvent.blockNumber, txEvent.to, 1);
      // Raise an alert only if the contract called isn't a token (getTotalSupply method returns the max uint as the default value)
      if (totalSupply !== ethers.constants.MaxUint256) return findings;
      if (wasCalledContractCreatedByInitiator) {
        const fromRecord = balanceChangesMapUsd.get(ethers.utils.getAddress(txEvent.from));
        const toRecord = balanceChangesMapUsd.get(ethers.utils.getAddress(txEvent.to));

        const fromSum = fromRecord ? Object.values(fromRecord).reduce((acc, value) => acc + value, 0) : 0;
        const toSum = toRecord ? Object.values(toRecord).reduce((acc, value) => acc + value, 0) : 0;

        // Create a finding only if the funds are not removed from either txEvent.from or txEvent.to (except if it's a very small amount)
        if (fromSum >= -750 && toSum >= -750) {
          let matchingTokenTransferFound = false;
          if (toSum === 0) {
            // Skip alert generation for transactions where `tx.from` and `tx.to` exchange the same token amount with opposite signs.
            // Often, there is an exchange of a token and its derivative (e.g., original vs. wrapped versions), where only the original token's price is retrievable.
            matchingTokenTransferFound = hasMatchingTokenTransfer(txEvent, balanceChangesMap);
          }
          if (!matchingTokenTransferFound) {
            findings.push(
              createFinding(
                filteredLargeProfitAddresses,
                txEvent.hash,
                FindingSeverity.Medium,
                txEvent.from,
                txEvent.to
              )
            );
          }
        }
      } else {
        await Promise.all(
          filteredLargeProfitAddresses.map(async (entry: LargeProfitAddress) => {
            if (
              entry.address.toLowerCase() === txEvent.from.toLowerCase() ||
              (newEOAs.filter((address) => !address.startsWith("0x00000000000000000000000000000000")).length === 1 &&
                newEOAs.includes(entry.address))
            ) {
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
