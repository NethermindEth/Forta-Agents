import { Finding, FindingSeverity, HandleTransaction, TransactionEvent, ethers, getEthersProvider } from "forta-agent";
import { ERC20_TRANSFER_EVENT, WRAPPED_NATIVE_TOKEN_EVENTS, ZERO, createFinding, wrappedNativeTokens } from "./utils";
import Fetcher from "./fetcher";
import { keys } from "./keys";
import { EOA_TRANSACTION_COUNT_THRESHOLD } from "./config";

export const provideHandleTransaction =
  (fetcher: Fetcher, provider: ethers.providers.Provider): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    if (txEvent.to) {
      const isToAnEOA = (await provider.getCode(txEvent.to)) === "0x";
      if (isToAnEOA) return findings;
    }
    if ((await provider.getTransactionCount(txEvent.from)) > EOA_TRANSACTION_COUNT_THRESHOLD) return findings;

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

    // Remove empty records and filter out addresses other than txEvent.from and txEvent.to
    balanceChangesMap.forEach((record: Record<string, ethers.BigNumber>, key: string) => {
      Object.keys(record).forEach((token) => {
        if (record[token].eq(ZERO)) {
          delete record[token];
        }
      });
      if (
        Object.keys(record).length === 0 ||
        ![txEvent.from.toLowerCase(), txEvent.to?.toLowerCase()].includes(key.toLowerCase())
      ) {
        balanceChangesMap.delete(key);
      }
    });

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

      // If the sum of the values is more than 10000 USD, add the address to the victims list
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

            if (usdValue === 0) {
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

              const value = balanceChangesMap.get(address);
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
                    percentage = absValue.mul(100).div(totalSupply).toNumber();
                  } catch {
                    percentage = 0;
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
