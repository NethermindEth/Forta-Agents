import { Finding, FindingSeverity, HandleTransaction, TransactionEvent, ethers, getEthersProvider } from "forta-agent";
import LRU from "lru-cache";
import {
  ERC20_TRANSFER_EVENT,
  LOAN_CREATED_ABI,
  LargeProfitAddress,
  UNISWAP_ROUTER_ADDRESSES,
  WRAPPED_NATIVE_TOKEN_EVENTS,
  ZERO,
  createFinding,
  nftCollateralizedLendingProtocols,
  wrappedNativeTokens,
} from "./utils";
import Fetcher from "./fetcher";
import { keys } from "./keys";
import { EOA_TRANSACTION_COUNT_THRESHOLD } from "./config";

let transactionsProcessed = 0;
let lastBlock = 0;

const TX_COUNT_THRESHOLD = 70;

const contractsCache = new LRU<string, boolean>({
  max: 10000,
});

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

    const erc20TransferEvents = txEvent.filterLog(ERC20_TRANSFER_EVENT).filter((event) => !event.args.value.eq(ZERO));

    // return if it's a single transfer or a single swap
    if (erc20TransferEvents.length < 3) return findings;

    const loanCreatedEvents = txEvent.filterLog(LOAN_CREATED_ABI);
    if (loanCreatedEvents.length > 0) {
      return findings;
    }

    if (txEvent.to) {
      if (nftCollateralizedLendingProtocols[txEvent.network].includes(txEvent.to.toLowerCase())) {
        return findings;
      }
      if (UNISWAP_ROUTER_ADDRESSES.includes(txEvent.to.toLowerCase())) {
        return findings;
      }
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
    const largeProfitAddresses: LargeProfitAddress[] = [];
    balanceChangesMapUsd.forEach((record: Record<string, number>, address: string) => {
      const sum = Object.values(record).reduce((acc, value) => {
        return acc + value;
      }, 0);

      // If the sum of the values is more than 10000 USD, add the address to the large profit addresses list
      if (sum > 10000) {
        const [confidence, anomalyScore] = fetcher.getCLandAS(sum, "usdValue") as number[];
        largeProfitAddresses.push({ address, confidence, anomalyScore, isProfitInUsd: true, profit: sum });
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
                  const tokenCreator = await fetcher.getContractCreator(token, Number(txEvent.network));
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
      })
    );
    if (!(largeProfitAddresses.length > 0)) {
      return findings;
    }

    // Filter out duplicate addresses, keeping the entry with the higher confidence level
    const filteredLargeProfitAddresses = largeProfitAddresses.reduce((acc: LargeProfitAddress[], curr) => {
      const existingIndex = acc.findIndex((item: LargeProfitAddress) => item.address === curr.address);
      if (existingIndex === -1) {
        acc.push(curr);
      } else if (acc[existingIndex].confidence < curr.confidence) {
        acc[existingIndex].confidence = curr.confidence;
        acc[existingIndex].anomalyScore = curr.anomalyScore;
      }
      return acc;
    }, []);

    let wasCalledContractCreatedByInitiator = false;
    if (!txEvent.to) {
      findings.push(
        createFinding(filteredLargeProfitAddresses, txEvent.hash, FindingSeverity.Medium, txEvent.from, "")
      );
    } else {
      wasCalledContractCreatedByInitiator =
        (await fetcher.getContractCreator(txEvent.to, Number(txEvent.network))) === txEvent.from.toLowerCase();
      if (wasCalledContractCreatedByInitiator) {
        findings.push(
          createFinding(filteredLargeProfitAddresses, txEvent.hash, FindingSeverity.Medium, txEvent.from, txEvent.to)
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
                } else return;
              }
            }
          })
        );
      }
    }

    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(new Fetcher(getEthersProvider(), keys), getEthersProvider()),
  provideHandleTransaction,
};
