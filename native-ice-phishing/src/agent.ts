import {
  Finding,
  TransactionEvent,
  ethers,
  getEthersProvider,
  FindingSeverity,
  Initialize,
  getAlerts,
  AlertQueryOptions,
  AlertsResponse,
  BlockEvent,
  Alert,
} from "forta-agent";
import { ScanCountType } from "bot-alert-rate";
import calculateAlertRate from "bot-alert-rate";
import DataFetcher from "./fetcher";
import {
  createCriticalNIPSeverityFinding,
  createCriticalSeverityFinding,
  createFinding,
  createHighSeverityFinding,
  createLowSeverityFinding,
  createMulticallPhishingCriticalSeverityFinding,
  createMulticallPhishingFinding,
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
  checkRoundValue,
  WITHDRAWTO_SIG,
  MULTICALL_SIG,
  MULTICALL_ABI,
  TRANSFER_FROM_ABI,
  TRANSFER_FROM_SIG,
  TRANSFER_EVENT_ABI,
  TRANSFER_SIG,
  TRANSFER_ABI,
} from "./utils";
import { PersistenceHelper } from "./persistence.helper";
import ErrorCache from "./error.cache";

let chainId: number = 0;
let txWithInputDataCount = 0;
let transfersCount = 0;
let contractCreationsCount = 0;
let withdrawalsCount = 0;
let erc20TransfersCount = 0;
let isRelevantChain: boolean;

let storedData: Data = {
  nativeTransfers: {},
  alertedAddresses: [],
  alertedHashes: [],
  alertedAddressesCritical: [],
};
let alertedSigsWithAddress: string[] = [];
let alertedHashesWithAddress: string[] = [];

let infoAlerts: { alerts: Alert[] } = {
  alerts: [],
};

let multicallScamContracts: string[] = [];
let isInitialized = false;

let lastTimestamp = 0;
let lastExecutedMinute = 0;

export const BOT_ID =
  "0x1a69f5ec8ef436e4093f9ec4ce1a55252b7a9a2d2c386e3f950b79d164bc99e0";

const DATABASE_URL = "https://research.forta.network/database/bot/";

const DATABASE_OBJECT_KEYS = {
  transfersKey: "nm-native-icephishing-bot-objects-v7",
  alertedAddressesKey: "nm-native-icephishing-bot-objects-v2-alerted",
  alertedAddressesCriticalKey:
    "nm-native-icephishing-bot-objects-v3-alerted-critical",
};

const getPastAlertsOncePerDay = async () => {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  const oneDayAgo = new Date();
  oneDayAgo.setDate(today.getDate() - 1);
  const twoHundredDaysAgo = new Date();
  twoHundredDaysAgo.setDate(today.getDate() - 200);

  const nip4Query: AlertQueryOptions = {
    botIds: [BOT_ID],
    alertId: "NIP-4",
    chainId,
    blockDateRange: {
      startDate: sevenDaysAgo,
      endDate: sevenDaysAgo,
    },
    first: 100,
  };

  const nip8Query: AlertQueryOptions = {
    botIds: [BOT_ID],
    alertId: "NIP-8",
    chainId,
    blockDateRange: {
      startDate: isInitialized ? oneDayAgo : twoHundredDaysAgo,
      endDate: today,
    },
    first: 200,
  };

  const [nip4Alerts, nip8Alerts] = await Promise.all([
    getAlerts(nip4Query),
    getAlerts(nip8Query),
  ]);

  nip4Alerts.alerts.forEach((alert) => {
    infoAlerts.alerts.push(alert);
  });

  nip8Alerts.alerts.forEach((alert) => {
    const {
      metadata: { address },
    } = alert;
    if (!multicallScamContracts.includes(address)) {
      multicallScamContracts.push(address);
    }
  });

  if (!isInitialized) {
    isInitialized = true;
  }
};

export const provideInitialize = (
  provider: ethers.providers.Provider,
  persistenceHelper: PersistenceHelper,
  storedData: Data,
  databaseKeys: {
    transfersKey: string;
    alertedAddressesKey: string;
    alertedAddressesCriticalKey: string;
  },
  getAlerts: (query: AlertQueryOptions) => Promise<AlertsResponse>
): Initialize => {
  return async () => {
    process.env["ZETTABLOCK_API_KEY"] = ZETTABLOCK_API_KEY;
    ({ chainId } = await provider.getNetwork());

    //  Optimism, Fantom & Avalanche not yet supported by bot-alert-rate package
    isRelevantChain = [10, 250, 43114].includes(Number(chainId));

    databaseKeys.transfersKey += `-${chainId}`;
    databaseKeys.alertedAddressesKey += `-${chainId}`;
    databaseKeys.alertedAddressesCriticalKey += `-${chainId}`;

    storedData.nativeTransfers = await persistenceHelper.load(
      databaseKeys.transfersKey
    );
    storedData.alertedAddresses = await persistenceHelper.load(
      databaseKeys.alertedAddressesKey
    );
    storedData.alertedAddressesCritical = await persistenceHelper.load(
      databaseKeys.alertedAddressesCriticalKey
    );

    // Force push an "address" in order to differentiate from a failed call that would return an empty string array
    if (!storedData.alertedAddresses.length) {
      storedData.alertedAddresses.push("placeholderAddress");
      await persistenceHelper.persist(
        storedData.alertedAddresses,
        databaseKeys.alertedAddressesKey
      );
    }

    if (!storedData.alertedAddressesCritical.length) {
      storedData.alertedAddressesCritical.push("placeholderAddress");
      await persistenceHelper.persist(
        storedData.alertedAddressesCritical,
        databaseKeys.alertedAddressesCriticalKey
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

    alertedSigsWithAddress = alertedFuncSigs.map((sig) => {
      const modifiedSig = sig.replace("()", "(address)");
      return modifiedSig;
    });

    alertedHashesWithAddress = alertedSigsWithAddress.map((sig) =>
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes(sig)).substring(0, 10)
    );

    const initializeAndGetPastAlerts = async () => {
      await getPastAlertsOncePerDay();
    };

    // Call the function once to await it
    await initializeAndGetPastAlerts();
    setInterval(initializeAndGetPastAlerts, 24 * 60 * 60 * 1000);

    return {
      alertConfig: {
        subscriptions: [
          {
            botId: BOT_ID,
            chainId: chainId,
            alertIds: ["NIP-4", "NIP-7"],
          },
        ],
      },
    };
  };
};

export const provideHandleTransaction =
  (
    dataFetcher: DataFetcher,
    persistenceHelper: PersistenceHelper,
    databaseKeys: {
      transfersKey: string;
      alertedAddressesKey: string;
      alertedAddressesCriticalKey: string;
    },
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

    if (isRelevantChain) {
      erc20TransfersCount += txEvent.filterLog(TRANSFER_EVENT_ABI).length;
    }

    const multicalls = txEvent.filterFunction(MULTICALL_ABI);

    if (multicalls.length) {
      let attackers: string[] = [];
      let victims: string[] = [];

      const isScamContract = multicallScamContracts
        .map((contractAddress) => contractAddress.toLowerCase())
        .includes(txEvent.to!.toLowerCase());

      if (isScamContract) {
        txEvent.traces.forEach((trace) => {
          if (trace.action.input?.startsWith(`0x${MULTICALL_SIG}`)) {
            attackers.push(trace.action.from, trace.action.to);
          }
        });
        multicalls.forEach((invocation) => {
          const { args }: { args: ethers.utils.Result } = invocation;

          args[0].forEach((call: any) => {
            if (call.callData.startsWith(TRANSFER_FROM_SIG)) {
              const iface = new ethers.utils.Interface(TRANSFER_FROM_ABI);
              const data = iface.decodeFunctionData(
                "transferFrom",
                call.callData
              );
              const { recipient, sender } = data;
              if (!attackers.includes(recipient)) attackers.push(recipient);
              if (!victims.includes(sender)) victims.push(sender);
            } else if (call.callData.startsWith(TRANSFER_SIG)) {
              const iface = new ethers.utils.Interface(TRANSFER_ABI);
              const data = iface.decodeFunctionData("transfer", call.callData);
              const { recipient } = data;
              if (!attackers.includes(recipient)) attackers.push(recipient);
            }
          });
        });

        if (attackers.length) {
          const anomalyScore = await calculateAlertRate(
            Number(chainId),
            BOT_ID,
            "NIP-9",
            isRelevantChain
              ? ScanCountType.CustomScanCount
              : ScanCountType.ErcTransferCount,
            erc20TransfersCount // No issue in passing 0 for non-relevant chains
          );
          const attackers_to_alert = [txEvent.from, ...attackers];
          // fundSenders will be populated in the "transferFrom" case (i.e. when the victim has given approval) and be empty in the "transfer" case (i.e. when the victim has already sent funds to the contract)
          findings.push(
            createMulticallPhishingFinding(
              attackers_to_alert,
              victims,
              anomalyScore
            )
          );
        }
      }
    }

    if (to) {
      let owner = "";
      let receiver = "";
      let conditionMetCount = 0; //
      let numberOfLogs = 10; // Initialize with the number out of the expected range
      const data = txEvent.transaction.data;
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
                    conditionMetCount++;
                    receiver = trace.action.to;
                  }
                }
              }
            }
          })
        );
        // Ensure that the condition is met only once (i.e. there's only one withdrawal)
        if (conditionMetCount === 1) {
          const anomalyScore = await calculateAlertRate(
            Number(chainId),
            BOT_ID,
            "NIP-6",
            ScanCountType.CustomScanCount,
            withdrawalsCount
          );
          findings.push(
            createWithdrawalFinding(hash, from, to, receiver, anomalyScore)
          );
        }
      } else if (
        data === "0x" + WITHDRAW_SIG ||
        data.startsWith("0x00" + WITHDRAWTO_SIG)
      ) {
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
              const receiver = data.startsWith("0x00" + WITHDRAWTO_SIG)
                ? "0x" + data.substring(data.length - 40)
                : from;
              findings.push(
                createWithdrawalFinding(hash, from, to, receiver, anomalyScore)
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
        let withdrawToRecipient = false; // withdraw(uint256 amount, address recipient) case
        let withdrawFound = false; // withdraw() case

        const payableString = "payable";
        const payableMatches = sourceCode.match(new RegExp(payableString, "g"));

        // withdraw(uint256 amount, address recipient)
        const functionPattern =
          /function withdraw\(\w+ (\w+), \w+ (\w+)\) public onlyOwner\s*\{([^\}]*)\}/s;
        const match = sourceCode.match(functionPattern);
        if (match) {
          const amountVariableName = match[1];
          const recipientVariableName = match[2];
          const functionContent = match[3];

          const transferPattern = new RegExp(
            `payable\\(\\s*${recipientVariableName}\\s*\\)\\.transfer\\(\\s*${amountVariableName}\\s*\\);`
          );
          const callPattern = new RegExp(
            `payable\\(\\s*${recipientVariableName}\\s*\\)\\.call\\{value:\\s*${amountVariableName}`
          );

          // Checking for more than one "payable" match, as there will be one in the scam "deposit" function and one in the withdraw (payable(recipient))
          if (
            (callPattern.test(functionContent) ||
              transferPattern.test(functionContent)) &&
            payableMatches &&
            payableMatches.length > 1
          ) {
            withdrawToRecipient = true;
          }
        }

        // withdraw()
        const withdrawRegex =
          /require\(owner == msg.sender\);\s*msg\.sender\.transfer\(address\(this\)\.balance\);/g;
        if (withdrawRegex.test(sourceCode) && payableMatches) {
          withdrawFound = true;
        }

        if (withdrawFound || withdrawToRecipient) {
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
      } else if (code.includes(WITHDRAW_SIG) || code.includes(WITHDRAWTO_SIG)) {
        const hashesWithoutPrefix = alertedHashes.map((hash) => {
          return hash.substring(2);
        });
        const hasCodeWithoutPrefix = hashesWithoutPrefix.some(
          (c) => c !== WITHDRAW_SIG && c !== WITHDRAWTO_SIG && code.includes(c)
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
      } else if (code.includes(MULTICALL_SIG)) {
        const initialStorageSlot = await dataFetcher.getStorageSlot(
          createdContractAddress,
          0,
          blockNumber
        );
        if (
          !initialStorageSlot ||
          !initialStorageSlot.startsWith("0x000000000000000000000000")
        ) {
          return findings;
        }

        const ethAddressFromStorage = "0x" + initialStorageSlot.slice(-40);
        const secondaryStorageSlot = await dataFetcher.getStorageSlot(
          ethAddressFromStorage,
          0,
          blockNumber
        );

        if (
          !secondaryStorageSlot ||
          !secondaryStorageSlot.startsWith("0x000000000000000000000000")
        ) {
          return findings;
        }

        const finalAddress = "0x" + secondaryStorageSlot.slice(-40);

        const code = await dataFetcher.getCode(finalAddress);
        if (
          code &&
          (code.includes(WITHDRAW_SIG) || code.includes(WITHDRAWTO_SIG))
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
            createMulticallPhishingCriticalSeverityFinding(
              hash,
              from,
              createdContractAddress,
              anomalyScore
            )
          );
        }
      }
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

      // Check if the "victim" address has been involved in a transfer in the last 2 blocks
      const isInvolved = await dataFetcher.isRecentlyInvolvedInTransfer(
        from,
        hash,
        Number(chainId),
        blockNumber
      );
      if (!isInvolved) {
        const fromNonce: number = await dataFetcher.getNonce(from);
        if (fromNonce < fromTxCountThreshold) {
          // if nativeTransfers[to] is already populated, we set the boolean values manually to avoid the extra call
          let [isFirstInteraction, hasHighNumberOfTotalTxs] =
            nativeTransfers[to] &&
            nativeTransfers[to].length >= transfersThreshold / 3
              ? [true, false]
              : await dataFetcher.getAddressInfo(
                  to,
                  from,
                  Number(chainId),
                  hash
                );

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
              nativeTransfers[to] = filterConflictingEntries(
                nativeTransfers[to]
              );
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
                    const victims = nativeTransfers[to].map(
                      (transfer) => transfer.from
                    );

                    // Check if the majority of the "victims" have interacted with the same address
                    const haveInteractedWithSameAddress =
                      await dataFetcher.haveInteractedWithSameAddress(
                        to,
                        victims,
                        chainId
                      );
                    if (!haveInteractedWithSameAddress) {
                      const label = await dataFetcher.getLabel(
                        to,
                        Number(chainId)
                      );
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
                          transfersCount
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
          let isValueRound = true;
          let isValueUnique = false;
          const [alertId, severity] =
            value !== "0x0"
              ? ["NIP-1", FindingSeverity.Medium]
              : ["NIP-2", FindingSeverity.Info];
          if (value !== "0x0") {
            const bNValue = ethers.BigNumber.from(value);
            isValueRound = checkRoundValue(bNValue);
            if (!isValueRound) {
              isValueUnique = await dataFetcher.isValueUnique(
                to,
                chainId,
                hash,
                bNValue.toString()
              );
            }
          }
          if (value === "0x0" || (!isValueRound && isValueUnique)) {
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
          }
        } else {
          console.log(
            `No signature found for ${data} in ${hash} from ${from} to ${to}`
          );
        }
      }
    } else if (value !== "0x0") {
      for (const alertedHash of alertedHashesWithAddress) {
        if (data.startsWith(alertedHash) && !data.includes(from.slice(2))) {
          const code = await dataFetcher.getCode(to);
          if (!code) return findings;
          const sourceCode = await dataFetcher.getSourceCode(to, chainId);
          // Remove ")" from the end of the signature
          const trimmedSigs = alertedSigsWithAddress.map((sig) =>
            sig.slice(0, -1)
          );
          const suspiciousFuncsCounts = trimmedSigs.filter((sig) =>
            sourceCode.includes(sig)
          ).length;
          if (suspiciousFuncsCounts >= 4) {
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

      for (const alertedHash of alertedHashes) {
        if (data.startsWith(alertedHash)) {
          const code = await dataFetcher.getCode(to);
          if (!code) return findings;

          const funcs = await dataFetcher.getFunctions(code);
          if (funcs.length > 5) {
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

    return findings;
  };

export const provideHandleBlock =
  (
    dataFetcher: DataFetcher,
    persistenceHelper: PersistenceHelper,
    storedData: Data,
    databaseKeys: {
      transfersKey: string;
      alertedAddressesKey: string;
      alertedAddressesCriticalKey: string;
    },
    infoAlerts: { alerts: Alert[] },
    getAlerts: (query: AlertQueryOptions) => Promise<AlertsResponse>,
    calculateAlertRate: any
  ) =>
  async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    let { nativeTransfers, alertedAddresses, alertedAddressesCritical } =
      storedData;

    const date = new Date();
    const minutes = date.getMinutes();

    if (minutes % 10 === 0 && lastExecutedMinute !== minutes) {
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

      if (blockEvent.block.timestamp - lastTimestamp > TIME_PERIOD) {
        alertedAddresses = [];
        alertedAddresses.push("placeholderAddress");
        await persistenceHelper.persist(
          alertedAddresses,
          databaseKeys.alertedAddressesKey
        );
        alertedAddressesCritical = [];
        alertedAddressesCritical.push("placeholderAddress");
        await persistenceHelper.persist(
          alertedAddressesCritical,
          databaseKeys.alertedAddressesCriticalKey
        );

        lastTimestamp = blockEvent.block.timestamp;
      }

      lastExecutedMinute = minutes;
    }

    if (ErrorCache.len() > 0) {
      console.log(`Pushing ${ErrorCache.len()} errors to findings`);
      findings.push(...ErrorCache.getAll());
      ErrorCache.clear();
    }

    if (infoAlerts.alerts.length > 0) {
      let { alertedAddressesCritical } = storedData;

      alertedAddressesCritical = await persistenceHelper.load(
        databaseKeys.alertedAddressesCriticalKey
      );

      const query: AlertQueryOptions = {
        botIds: [BOT_ID],
        alertId: "NIP-7",
        chainId,
        blockNumberRange: {
          startBlockNumber: blockEvent.blockNumber - 3000,
          endBlockNumber: blockEvent.blockNumber,
        },
        first: 1000,
      };

      const maxRetries = 3;
      let criticalAlerts;

      for (let retry = 1; retry <= maxRetries; retry++) {
        try {
          criticalAlerts = await getAlerts(query);
          break; // If the operation succeeds, exit the loop
        } catch (error) {
          console.error(
            `Error occurred on attempt ${retry}. Retrying...`,
            error
          );
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      if (!criticalAlerts) return findings;

      criticalAlerts.alerts.forEach((alert) => {
        if (!alertedAddressesCritical.includes(alert.metadata.attacker)) {
          alertedAddressesCritical.push(alert.metadata.attacker);
        }
      });

      for (const alert of infoAlerts.alerts) {
        const attacker = alert.metadata.attacker;

        // Skip processing if the attacker has already been processed
        if (alertedAddressesCritical.includes(attacker)) {
          continue;
        }

        const victims = Object.keys(alert.metadata)
          .filter((key) => key.startsWith("victim"))
          .map((key) => alert.metadata[key]);

        const haveInteractedAgain = await dataFetcher.haveInteractedAgain(
          attacker,
          victims,
          chainId
        );

        if (!haveInteractedAgain) {
          const anomalyScore = await calculateAlertRate(
            Number(chainId),
            BOT_ID,
            "NIP-7",
            isRelevantChain
              ? ScanCountType.CustomScanCount
              : ScanCountType.TransferCount,
            transfersCount
          );

          findings.push(
            createCriticalNIPSeverityFinding(attacker, victims, anomalyScore)
          );

          alertedAddressesCritical.push(attacker); // Add the processed attacker to the list
          await persistenceHelper.persist(
            Array.from(new Set(alertedAddressesCritical)),
            databaseKeys.alertedAddressesCriticalKey
          );
        }
      }
    }

    infoAlerts.alerts.splice(0, infoAlerts.alerts.length);

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
    new PersistenceHelper(DATABASE_URL),
    DATABASE_OBJECT_KEYS,
    calculateAlertRate,
    storedData
  ),
  handleBlock: provideHandleBlock(
    new DataFetcher(getEthersProvider(), keys),
    new PersistenceHelper(DATABASE_URL),
    storedData,
    DATABASE_OBJECT_KEYS,
    infoAlerts,
    getAlerts,
    calculateAlertRate
  ),
};
