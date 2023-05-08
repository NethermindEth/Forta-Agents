import {
  Finding,
  TransactionEvent,
  ethers,
  getEthersProvider,
  FindingSeverity,
  Initialize,
  getAlerts,
  HandleAlert,
  AlertEvent,
} from "forta-agent";
import { ScanCountType } from "bot-alert-rate";
import calculateAlertRate from "bot-alert-rate";
import DataFetcher from "./fetcher";
import {
  createCriticalSeverityFinding,
  createFinding,
  createHighSeverityFinding,
  createLowSeverityFinding,
  createWithdrawalFinding,
} from "./findings";
import { ZETTABLOCK_API_KEY } from "./key";
import { keys } from "./keys";
import {
  toTxCountThreshold,
  fromTxCountThreshold,
  TIME_PERIOD,
  transfersThreshold,
  POLYGON_MATIC_ADDRESS,
  MAX_OBJECT_SIZE,
  Data,
  Transfer,
  filterConflictingEntries,
  WITHDRAW_SIG,
  BALANCEOF_SIG,
} from "./utils";
import { PersistenceHelper } from "./persistence.helper";
import {
  AlertQueryOptions,
  AlertsResponse,
} from "forta-agent/dist/sdk/graphql/forta";

let chainId: number = 0;
let txWithInputDataCount = 0;
let transfersCount = 0;
let contractCreationsCount = 0;
let withdrawalsCount = 0;
let isRelevantChain: boolean;

let storedData: Data = {
  nativeTransfers: {},
  alertedAddresses: [],
  alertedHashes: [],
};

let transactions: ethers.providers.TransactionResponse[] = [];
let transactionsProcessed = 0;
let lastTimestamp = 0;
let lastBlock = 0;

export const BOT_ID =
  "0x1a69f5ec8ef436e4093f9ec4ce1a55252b7a9a2d2c386e3f950b79d164bc99e0";

const DATABASE_URL = "https://research.forta.network/database/bot/";

const DATABASE_OBJECT_KEYS = {
  transfersKey: "nm-native-icephishing-bot-objects-v7",
  alertedAddressesKey: "nm-native-icephishing-bot-objects-v2-alerted",
};

export const provideInitialize = (
  provider: ethers.providers.Provider,
  persistenceHelper: PersistenceHelper,
  storedData: Data,
  databaseKeys: { transfersKey: string; alertedAddressesKey: string },
  getAlerts: (query: AlertQueryOptions) => Promise<AlertsResponse>
): Initialize => {
  return async () => {
    process.env["ZETTABLOCK_API_KEY"] = ZETTABLOCK_API_KEY;
    ({ chainId } = await provider.getNetwork());

    //  Optimism, Fantom & Avalanche not yet supported by bot-alert-rate package
    isRelevantChain = [10, 250, 43114].includes(Number(chainId));

    databaseKeys.transfersKey += `-${chainId}`;
    databaseKeys.alertedAddressesKey += `-${chainId}`;

    storedData.nativeTransfers = await persistenceHelper.load(
      databaseKeys.transfersKey
    );
    storedData.alertedAddresses = await persistenceHelper.load(
      databaseKeys.alertedAddressesKey
    );

    // Force push an "address" in order to differentiate from a failed call that would return an empty string array
    if (!storedData.alertedAddresses.length) {
      storedData.alertedAddresses.push("placeholderAddress");
      await persistenceHelper.persist(
        storedData.alertedAddresses,
        databaseKeys.alertedAddressesKey
      );
    }

    // Same for the nativeTransfers object
    if (!Object.keys(storedData.nativeTransfers).length) {
      storedData.nativeTransfers["0x0000000000000000000000000000000000000000"] =
        [
          {
            from: "0x0000000000000000000000000000000000000001",
            fromNonce: 10000000,
            fundingAddress: "0x0000000000000000000000000000000000000002",
            latestTo: "0x0000000000000000000000000000000000000003",
            value: "70000000000000000",
            timestamp: 100,
          },
        ];
      await persistenceHelper.persist(
        storedData.nativeTransfers,
        databaseKeys.transfersKey
      );
    }

    const query: AlertQueryOptions = {
      botIds: [BOT_ID],
      alertId: "NIP-1",
      blockDateRange: {
        startDate: new Date(0, 0, 0),
        endDate: new Date(),
      },
      first: 2000,
    };
    const pastAlerts = await getAlerts(query);
    const alertedFuncSigs: string[] = Array.from(
      new Set(
        pastAlerts.alerts.map((alert: any) => {
          const {
            metadata: { funcSig },
          } = alert;
          return funcSig;
        })
      )
    );

    storedData.alertedHashes = alertedFuncSigs.map((sig) =>
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes(sig)).substring(0, 10)
    );

    return {
      alertConfig: {
        subscriptions: [
          {
            botId: BOT_ID,
            chainId: chainId,
            alertIds: ["NIP-4"],
          },
        ],
      },
    };
  };
};

let st = 0;

export const provideHandleAlert =
  (
    persistenceHelper: PersistenceHelper,
    databaseKeys: { transfersKey: string; alertedAddressesKey: string }
  ): HandleAlert =>
  async (alertEvent: AlertEvent) => {
    storedData.alertedAddresses.push(alertEvent.alert.metadata.attacker);
    await persistenceHelper.persist(
      storedData.alertedAddresses,
      databaseKeys.alertedAddressesKey
    );
    return [];
  };

export const provideHandleTransaction =
  (
    dataFetcher: DataFetcher,
    provider: ethers.providers.Provider,
    persistenceHelper: PersistenceHelper,
    databaseKeys: { transfersKey: string; alertedAddressesKey: string },
    calculateAlertRate: any,
    storedData: Data
  ) =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    let { nativeTransfers, alertedAddresses, alertedHashes } = storedData;
    const {
      hash,
      from,
      to,
      transaction: { value, data },
      timestamp,
      logs,
      blockNumber,
    } = txEvent;

    if (to) {
      let owner = "";
      let numberOfLogs = 10; // Initialize with the number out of the expected range

      if (txEvent.traces.length) {
        await Promise.all(
          txEvent.traces.map(async (trace) => {
            if (trace.action.value !== "0x0" && trace.action.to !== to) {
              withdrawalsCount++;

              if (!owner) {
                owner = await dataFetcher.getOwner(to, blockNumber);
              }
              if (owner && from === owner.toLowerCase()) {
                // Only fetch the number of logs if it is not already known
                if (numberOfLogs === 10) {
                  numberOfLogs = await dataFetcher.getNumberOfLogs(
                    to,
                    blockNumber,
                    chainId
                  );
                }
                if (numberOfLogs < 2) {
                  const hasValidEntries = await dataFetcher.hasValidEntries(
                    to,
                    chainId,
                    hash
                  );
                  if (hasValidEntries) {
                    const anomalyScore = await calculateAlertRate(
                      Number(chainId),
                      BOT_ID,
                      "NIP-6",
                      ScanCountType.CustomScanCount,
                      withdrawalsCount // No issue in passing 0 for non-relevant chains
                    );
                    findings.push(
                      createWithdrawalFinding(hash, from, to, anomalyScore)
                    );
                  }
                }
              }
            }
          })
        );
      } else if (txEvent.transaction.data === "0x" + WITHDRAW_SIG) {
        withdrawalsCount++;

        owner = await dataFetcher.getOwner(to, blockNumber);
        if (owner && from === owner.toLowerCase()) {
          numberOfLogs = await dataFetcher.getNumberOfLogs(
            to,
            blockNumber,
            chainId
          );

          if (numberOfLogs < 2) {
            const hasValidEntries = await dataFetcher.hasValidEntries(
              to,
              chainId,
              hash
            );
            if (hasValidEntries) {
              const anomalyScore = await calculateAlertRate(
                Number(chainId),
                BOT_ID,
                "NIP-6",
                ScanCountType.CustomScanCount,
                withdrawalsCount // No issue in passing 0 for non-relevant chains
              );
              findings.push(
                createWithdrawalFinding(hash, from, to, anomalyScore)
              );
            }
          }
        }
      }
    } else {
      if (isRelevantChain) contractCreationsCount++;
      const nonce = txEvent.transaction.nonce;
      const createdContractAddress = ethers.utils.getContractAddress({
        from,
        nonce,
      });

      const code = await dataFetcher.getCode(createdContractAddress);
      if (!code || code.includes(BALANCEOF_SIG)) {
        return findings;
      }

      const events = await dataFetcher.getEvents(code);
      const functions = await dataFetcher.getFunctions(code);
      if (events.length > 1 || functions.length > 10) {
        return findings;
      }

      const sourceCode = await dataFetcher.getSourceCode(
        createdContractAddress,
        chainId
      );
      if (sourceCode) {
        const payableString = "payable";
        const withdrawRegex =
          /require\(owner == msg.sender\);\s*msg\.sender\.transfer\(address\(this\)\.balance\);/g;
        if (
          withdrawRegex.test(sourceCode) &&
          sourceCode.includes(payableString)
        ) {
          const anomalyScore = await calculateAlertRate(
            Number(chainId),
            BOT_ID,
            "NIP-5",
            isRelevantChain
              ? ScanCountType.CustomScanCount
              : ScanCountType.ContractCreationCount,
            contractCreationsCount // No issue in passing 0 for non-relevant chains
          );
          findings.push(
            createCriticalSeverityFinding(
              hash,
              from,
              createdContractAddress,
              anomalyScore
            )
          );
        }
      } else if (code.includes(WITHDRAW_SIG)) {
        const hashesWithoutPrefix = alertedHashes.map((hash) => {
          return hash.substring(2);
        });
        const hasCodeWithoutPrefix = hashesWithoutPrefix.some(
          (c) => c !== WITHDRAW_SIG && code.includes(c)
        );
        if (hasCodeWithoutPrefix) {
          const anomalyScore = await calculateAlertRate(
            Number(chainId),
            BOT_ID,
            "NIP-5",
            isRelevantChain
              ? ScanCountType.CustomScanCount
              : ScanCountType.ContractCreationCount,
            contractCreationsCount // No issue in passing 0 for non-relevant chains
          );
          findings.push(
            createCriticalSeverityFinding(
              hash,
              from,
              createdContractAddress,
              anomalyScore
            )
          );
        }
      }
    }

    // At the beginning of the block
    if (blockNumber != lastBlock) {
      const et = new Date().getTime();
      console.log(`Block processing time: ${et - st} ms`);
      const fetchedTransfers: Record<string, Transfer[]> =
        await persistenceHelper.load(databaseKeys.transfersKey);
      if (Object.keys(fetchedTransfers).length > 0) {
        const uniqueAndSortedTransfersRecord: Record<string, Transfer[]> = {};

        Object.entries(fetchedTransfers).forEach(([key, transfers]) => {
          uniqueAndSortedTransfersRecord[key] = transfers
            .filter((transfer: Transfer, index: number, self: Transfer[]) => {
              return (
                index ===
                self.findIndex((t: Transfer) => t.from === transfer.from)
              );
            })
            .sort((a: Transfer, b: Transfer) => a.timestamp - b.timestamp);
        });

        nativeTransfers = uniqueAndSortedTransfersRecord;
      }

      console.log(
        "Size of transfers object: ",
        Buffer.from(JSON.stringify(nativeTransfers)).length
      );

      alertedAddresses = await persistenceHelper.load(
        databaseKeys.alertedAddressesKey
      );

      console.log("Size of alerted addresses :", alertedAddresses.length);
      transactions = (await dataFetcher.getTransactions(
        provider,
        blockNumber
      )) as ethers.providers.TransactionResponse[];

      if (timestamp - lastTimestamp > TIME_PERIOD) {
        alertedAddresses = [];
        alertedAddresses.push("placeholderAddress");
        await persistenceHelper.persist(
          alertedAddresses,
          databaseKeys.alertedAddressesKey
        );
        lastTimestamp = timestamp;
      }

      lastBlock = blockNumber;
      console.log(
        `-----Transactions processed in block ${
          blockNumber - 4
        }: ${transactionsProcessed}-----`
      );
      transactionsProcessed = 0;
      st = new Date().getTime();
    }

    transactionsProcessed += 1;

    // Extract the persistence logic into a function as it's used twice
    async function mergeAndPersistObjects() {
      // Load the existing objects from the database
      const persistedObj = await persistenceHelper.load(
        databaseKeys.transfersKey
      );
      const existingAlertedAddresses = await persistenceHelper.load(
        databaseKeys.alertedAddressesKey
      );

      // Merge the alertedAddresses array with the existing array and remove duplicates
      const mergedAlertedAddresses = Array.from(
        new Set([...existingAlertedAddresses, ...alertedAddresses])
      );

      // Remove the merged alerted addresses from the nativeTransfers and the persisted objects
      mergedAlertedAddresses.forEach((address) => {
        if (nativeTransfers[address]) {
          delete nativeTransfers[address];
        }
        if (persistedObj[address]) {
          delete persistedObj[address];
        }
      });

      // Merge the persisted object with the new object
      const mergedObj: Record<string, Transfer[]> = {
        ...nativeTransfers,
        ...persistedObj,
      };

      // Only save the merged alerted addresses to the database if their size is different from the existing array
      if (
        mergedAlertedAddresses.length !== existingAlertedAddresses.length &&
        existingAlertedAddresses.length > 0
      ) {
        await persistenceHelper.persist(
          mergedAlertedAddresses,
          databaseKeys.alertedAddressesKey
        );
      }

      // Iterate through the keys of the objects
      for (const key of Object.keys(nativeTransfers)) {
        const subArray = nativeTransfers[key];
        const persistedSubArray = persistedObj[key] || [];

        // Merge the two arrays
        const mergedSubArray = [...subArray];
        for (const obj of persistedSubArray) {
          if (
            !mergedSubArray.some(
              (o) => JSON.stringify(o.from) === JSON.stringify(obj.from)
            ) &&
            !mergedSubArray.some(
              (o) =>
                JSON.stringify(o.fundingAddress) ===
                JSON.stringify(obj.fundingAddress)
            )
          ) {
            mergedSubArray.push(obj);
          }
        }

        mergedObj[key] = mergedSubArray;
      }

      Object.entries(mergedObj).forEach(([key, transfers]) => {
        mergedObj[key] = transfers.sort(
          (a: Transfer, b: Transfer) => a.timestamp - b.timestamp
        );
      });

      let objectSize = Buffer.from(JSON.stringify(mergedObj)).length;
      while (objectSize > MAX_OBJECT_SIZE) {
        console.log("Cleaning Object of size: ", objectSize);

        // Sort and delete 1/4 of the keys as before
        const sortedKeys = Object.keys(mergedObj).sort((a, b) => {
          const latestTimestampA =
            mergedObj[a][mergedObj[a].length - 1].timestamp;
          const latestTimestampB =
            mergedObj[b][mergedObj[b].length - 1].timestamp;
          return latestTimestampA - latestTimestampB;
        });
        const indexToDelete = Math.floor(sortedKeys.length / 4);
        for (let i = 0; i < indexToDelete; i++) {
          delete mergedObj[sortedKeys[i]];
        }

        objectSize = Buffer.from(JSON.stringify(mergedObj)).length;
        console.log("Object size after cleaning: ", objectSize);

        storedData.nativeTransfers = mergedObj;
      }

      // Save the merged objects to the database
      if (Object.keys(persistedObj).length > 0) {
        await persistenceHelper.persist(mergedObj, databaseKeys.transfersKey);
      }
    }

    // In the last transaction of the block
    if (hash === transactions[transactions.length - 1].hash) {
      await mergeAndPersistObjects();
    }

    if (Number(chainId) !== 137) {
      if (logs.length) {
        return findings;
      }
    } else {
      // Polygon emits events for native transfers
      if (logs.some((log) => log.address !== POLYGON_MATIC_ADDRESS)) {
        return findings;
      }
    }

    if (!to || to === from) {
      return findings;
    }

    let isEOA = nativeTransfers[to] ? true : await dataFetcher.isEoa(to);

    if (isEOA === undefined) {
      return findings;
    }
    // Native Ice Phishing Logic
    if (
      value !== "0x0" &&
      data.length <= 10 &&
      ((nativeTransfers[to] &&
        !nativeTransfers[to].some(
          (existingTransfer) => existingTransfer.from === from
        )) ||
        (isEOA &&
          !nativeTransfers[to] &&
          (await dataFetcher.getNonce(to)) < toTxCountThreshold))
    ) {
      if (isRelevantChain) transfersCount++;

      const fromNonce: number = await dataFetcher.getNonce(from);
      if (fromNonce < fromTxCountThreshold) {
        // if nativeTransfers[to] is already populated, we set the boolean values manually to avoid the extra call
        let [isFirstInteraction, hasHighNumberOfTotalTxs] =
          nativeTransfers[to] &&
          nativeTransfers[to].length >= transfersThreshold / 3
            ? [true, false]
            : await dataFetcher.getAddressInfo(to, from, Number(chainId), hash);

        if (isFirstInteraction && !hasHighNumberOfTotalTxs) {
          // Get the address that originally funded the "from" address
          const [fundingAddress, latestTo] = await dataFetcher.getAddresses(
            from,
            Number(chainId),
            hash
          );
          if (fundingAddress) {
            const bnValue = ethers.BigNumber.from(value);
            const transfer = {
              from,
              fromNonce,
              fundingAddress,
              latestTo,
              value: bnValue.toString(),
              timestamp,
            };

            if (!nativeTransfers[to]) nativeTransfers[to] = [];

            const isTransferValueOutOfRangeForAtLeastOne = nativeTransfers[
              to
            ].some((existingTransfer) => {
              const lowerBound = ethers.BigNumber.from(existingTransfer.value)
                .mul(8)
                .div(10); // 80% of existing value
              const upperBound = ethers.BigNumber.from(existingTransfer.value)
                .mul(12)
                .div(10); // 120% of existing value
              return bnValue.lt(lowerBound) || bnValue.gt(upperBound);
            });

            const isTransferValueUnique = nativeTransfers[to].every(
              (existingTransfer) =>
                !ethers.BigNumber.from(existingTransfer.value).eq(bnValue)
            );
            const isLatestToUnique = nativeTransfers[to].every(
              (existingTransfer) => existingTransfer.latestTo !== latestTo
            );

            if (
              !nativeTransfers[to].length ||
              (isTransferValueOutOfRangeForAtLeastOne &&
                isTransferValueUnique &&
                isLatestToUnique &&
                timestamp >
                  nativeTransfers[to][nativeTransfers[to].length - 1]
                    .timestamp +
                    480)
            ) {
              nativeTransfers[to].push(transfer);
            }
            nativeTransfers[to] = filterConflictingEntries(nativeTransfers[to]);
            if (
              nativeTransfers[to].length > transfersThreshold &&
              !alertedAddresses.includes(to)
            ) {
              // Check that not all entries have the same nonce
              const nonces = nativeTransfers[to].map(
                (transfer) => transfer.fromNonce
              );

              const nonceCounts = nonces.reduce(
                (count: { [key: string]: number }, nonce) => {
                  count[nonce] = (count[nonce] || 0) + 1;
                  return count;
                },
                {}
              );

              const isCommonNonce = Object.values(nonceCounts).some(
                (count) => count > Math.ceil(nonces.length / 3)
              );

              if (!isCommonNonce) {
                const fundingCounts: { [fundingAddress: string]: number } =
                  nativeTransfers[to].reduce<{
                    [fundingAddress: string]: number;
                  }>((counts, t) => {
                    counts[t.fundingAddress] =
                      (counts[t.fundingAddress] || 0) + 1;
                    return counts;
                  }, {});

                const maxCount = Math.max(...Object.values(fundingCounts));

                if (maxCount < nativeTransfers[to].length / 2) {
                  const label = await dataFetcher.getLabel(to, Number(chainId));
                  if (
                    !label ||
                    ["xploit", "hish", "heist"].some((keyword) =>
                      label.includes(keyword)
                    )
                  ) {
                    const anomalyScore = await calculateAlertRate(
                      Number(chainId),
                      BOT_ID,
                      "NIP-4",
                      isRelevantChain
                        ? ScanCountType.CustomScanCount
                        : ScanCountType.TransferCount,
                      transfersCount // No issue in passing 0 for non-relevant chains
                    );

                    alertedAddresses.push(to);
                    // Persist instantly in order to avoid duplicate alerts in case the last transaction of the block is dropped
                    await persistenceHelper.persist(
                      alertedAddresses,
                      databaseKeys.alertedAddressesKey
                    );
                    findings.push(
                      createHighSeverityFinding(
                        to,
                        anomalyScore,
                        nativeTransfers[to]
                      )
                    );
                  }
                }
              }
              delete nativeTransfers[to];
              await persistenceHelper.persist(
                nativeTransfers,
                databaseKeys.transfersKey
              );
            }
          }
        }
      }
    }

    if (data === "0x") {
      return findings;
    }
    if (isRelevantChain) txWithInputDataCount++;

    // Social Engineering Logic
    if (isEOA) {
      if (data.length === 10) {
        const sig = await dataFetcher.getSignature(data);

        if (sig) {
          const [alertId, severity] =
            value !== "0x0"
              ? ["NIP-1", FindingSeverity.Medium]
              : ["NIP-2", FindingSeverity.Info];
          const anomalyScore = await calculateAlertRate(
            Number(chainId),
            BOT_ID,
            alertId,
            isRelevantChain
              ? ScanCountType.CustomScanCount
              : ScanCountType.TxWithInputDataCount,
            txWithInputDataCount // No issue in passing 0 for non-relevant chains
          );
          findings.push(
            createFinding(hash, from, to, sig, anomalyScore, severity)
          );
          if (!alertedHashes.includes(data)) {
            alertedHashes.push(data);
          }
        } else {
          console.log(
            `No signature found for ${data} in ${hash} from ${from} to ${to}`
          );
        }
      }
    } else if (value !== "0x0") {
      for (const alertedHash of alertedHashes) {
        if (data.startsWith(alertedHash)) {
          const code = await dataFetcher.getCode(to);
          if (!code) return findings;

          const funcs = await dataFetcher.getFunctions(code);
          if (funcs.length > 4) {
            return findings;
          }

          const [isFirstInteraction, hasHighNumberOfTotalTxs] =
            await dataFetcher.getAddressInfo(to, from, Number(chainId), hash);

          if (!isFirstInteraction || hasHighNumberOfTotalTxs) {
            return findings;
          }

          let sig;
          try {
            sig = await dataFetcher.getSignature(alertedHash);
          } catch {
            sig = alertedHash;
          }

          const anomalyScore = await calculateAlertRate(
            Number(chainId),
            BOT_ID,
            "NIP-3",
            isRelevantChain
              ? ScanCountType.CustomScanCount
              : ScanCountType.TxWithInputDataCount,
            txWithInputDataCount
          );

          findings.push(
            createLowSeverityFinding(hash, from, to, sig, anomalyScore)
          );

          break;
        }
      }
    }

    // In the last transaction of the block if the function has not already returned
    if (hash === transactions[transactions.length - 1].hash) {
      await mergeAndPersistObjects();
    }

    return findings;
  };

export default {
  initialize: provideInitialize(
    getEthersProvider(),
    new PersistenceHelper(DATABASE_URL),
    storedData,
    DATABASE_OBJECT_KEYS,
    getAlerts
  ),
  provideInitialize,
  handleTransaction: provideHandleTransaction(
    new DataFetcher(getEthersProvider(), keys),
    getEthersProvider(),
    new PersistenceHelper(DATABASE_URL),
    DATABASE_OBJECT_KEYS,
    calculateAlertRate,
    storedData
  ),
  handleAlert: provideHandleAlert(
    new PersistenceHelper(DATABASE_URL),
    DATABASE_OBJECT_KEYS
  ),
};
