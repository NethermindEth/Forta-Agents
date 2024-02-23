import { Block, Finding, Initialize, TransactionEvent, ethers, getEthersProvider } from "forta-agent";
import {
  NetworkData,
  Transfer,
  updateRecord,
  TIME_PERIOD,
  AlertedAddress,
  QueuedAddress,
  ERC20_TRANSFER_FUNCTION,
  deepMerge,
  MAX_OBJECT_SIZE,
} from "./utils";
import { NetworkManager } from "forta-agent-tools";
import { createFinding, createDelayedFinding } from "./findings";
import calculateAlertRate, { ScanCountType } from "bot-alert-rate";
import BalanceFetcher from "./balance.fetcher";
import DataFetcher from "./data.fetcher";
import ContractFetcher from "./contract.fetcher";
import MarketCapFetcher from "./marketcap.fetcher";
import PriceFetcher from "./price.fetcher";
import { PersistenceHelper } from "./persistence.helper";
import CONFIG, { priceThreshold } from "./bot.config";
import { getSecrets, ApiKeys, BlockExplorerApiKeys } from "./storage";

import fetch from "node-fetch";

const DATABASE_URL = "https://research.forta.network/database/bot/";
const DATABASE_OBJECT_KEYS = {
  transfersKey: "nm-pk-comp-bot-key-1",
  alertedAddressesKey: "nm-pk-comp-bot-alerted-addresses-key-1",
  queuedAddressesKey: "nm-pk-comp-bot-queued-addresses-key-1",
};

const BOT_ID = "0x6ec42b92a54db0e533575e4ebda287b7d8ad628b14a2268398fd4b794074ea03";

let chainId: string;
let apiKeys: ApiKeys;
let contractFetcher: ContractFetcher;
let transferObj: Transfer = {};
let alertedAddresses: AlertedAddress[] = [];
let queuedAddresses: QueuedAddress[] = [];
let isRelevantChain: boolean;
let transfersCount = 0;
let ercTransferCount = 0;
let transactionsProcessed = 0;
let topTokens: string[] = [];

let lastBlock = 0;

const networkManager = new NetworkManager<NetworkData>(CONFIG);
let st = 0;
let lastPersistenceTime = 0;
let isPersistenceTime = false;

export async function createNewContractFetcher(
  provider: ethers.providers.Provider,
  blockExplorerApiKeys: BlockExplorerApiKeys
): Promise<ContractFetcher> {
  return new ContractFetcher(provider, fetch, blockExplorerApiKeys);
}

export const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider,
  persistenceHelper: PersistenceHelper,
  databaseKeys: { transfersKey: string; alertedAddressesKey: string; queuedAddressesKey: string },
  marketCapFetcher: MarketCapFetcher,
  contractFetcherCreator: (
    provider: ethers.providers.Provider,
    blockExplorerApiKeys: BlockExplorerApiKeys
  ) => Promise<ContractFetcher>
): Initialize => {
  return async () => {
    await networkManager.init(provider);
    apiKeys = await getSecrets();
    process.env["ZETTABLOCK_API_KEY"] = apiKeys.generalApiKeys.ZETTABLOCK[0];
    contractFetcher = await contractFetcherCreator(provider, apiKeys.apiKeys.privateKeyCompromise);

    chainId = networkManager.getNetwork().toString();

    transferObj = await persistenceHelper.load(databaseKeys.transfersKey.concat("-", chainId));
    alertedAddresses = await persistenceHelper.load(databaseKeys.alertedAddressesKey.concat("-", chainId));
    queuedAddresses = await persistenceHelper.load(databaseKeys.queuedAddressesKey.concat("-", chainId));

    //  Optimism, Fantom & Avalanche not yet supported by bot-alert-rate package
    isRelevantChain = [10, 250, 43114].includes(Number(chainId));

    topTokens = await marketCapFetcher.getTopMarketCap();
  };
};

export const provideHandleTransaction =
  (
    provider: ethers.providers.Provider,
    networkManager: NetworkManager<NetworkData>,
    balanceFetcher: BalanceFetcher,
    dataFetcher: DataFetcher,
    marketCapFetcher: MarketCapFetcher,
    priceFetcher: PriceFetcher,
    persistenceHelper: PersistenceHelper,
    databaseKeys: { transfersKey: string; alertedAddressesKey: string; queuedAddressesKey: string }
  ) =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    const {
      hash,
      from,
      to,
      transaction: { value, data },
      timestamp,
      blockNumber,
    } = txEvent;

    // At the beginning of the block
    if (blockNumber != lastBlock) {
      // fetch top tokens list sorted by market cap in every 6 hours
      if (blockNumber % 1800 == 0) {
        topTokens = await marketCapFetcher.getTopMarketCap();
      }

      // fetch queue daily to check if the possible victims have been active for the last week
      if (blockNumber % 7200 == 0) {
        queuedAddresses = await persistenceHelper.load(databaseKeys.queuedAddressesKey.concat("-", chainId));
        await Promise.all(
          queuedAddresses
            .filter((queue) => timestamp - queue.timestamp > 604800)
            .map(async (el) => {
              const isActive = await contractFetcher.getVictimInfo(el.transfer.from, Number(chainId), el.timestamp);

              if (!isActive) {
                const anomalyScore = await calculateAlertRate(
                  Number(chainId),
                  BOT_ID,
                  "PKC-2",
                  isRelevantChain ? ScanCountType.CustomScanCount : ScanCountType.TransferCount,
                  transfersCount
                );
                findings.push(
                  createDelayedFinding(
                    el.transfer.txHash,
                    el.transfer.from,
                    el.transfer.to,
                    el.transfer.asset,
                    anomalyScore
                  )
                );
              }
            })
        );

        // Remove processed logs from the queue which are older than 1 week
        queuedAddresses = queuedAddresses.filter((address) => timestamp - address.timestamp < 604800);
        await persistenceHelper.persist(queuedAddresses, databaseKeys.queuedAddressesKey.concat("-", chainId));
      }
      const et = new Date().getTime();

      if (et / 1000 - lastPersistenceTime > 300) {
        isPersistenceTime = true;
        lastPersistenceTime = et / 1000;
      } else {
        isPersistenceTime = false;
      }

      console.log(`Block processing time: ${et - st} ms`);
      const loadedTransferObj = await persistenceHelper.load(databaseKeys.transfersKey.concat("-", chainId));
      alertedAddresses = await persistenceHelper.load(databaseKeys.alertedAddressesKey.concat("-", chainId));

      transferObj = deepMerge(transferObj, loadedTransferObj);

      // Remove alerted addresses from the object to be persisted into db
      if (alertedAddresses.length) {
        for (const el of alertedAddresses) {
          delete transferObj[el.address];
        }
      }

      alertedAddresses = alertedAddresses.filter((address) => timestamp - address.timestamp < TIME_PERIOD);

      lastBlock = blockNumber;
      console.log(`-----Transactions processed in the last block before ${blockNumber}: ${transactionsProcessed}-----`);
      transactionsProcessed = 0;
      st = new Date().getTime();

      let objectSize = Buffer.from(JSON.stringify(transferObj)).length;

      while (objectSize > MAX_OBJECT_SIZE) {
        console.log("Cleaning Object of size: ", objectSize);

        const indexToDelete = Math.floor(Object.keys(transferObj).length / 4);

        const myObj = Object.keys(transferObj);
        for (let i = 0; i < indexToDelete; i++) {
          delete transferObj[myObj[i]];
        }

        objectSize = Buffer.from(JSON.stringify(transferObj)).length;
        console.log("Object size after cleaning: ", objectSize);
      }

      if (isPersistenceTime) {
        await persistenceHelper.persist(transferObj, databaseKeys.transfersKey.concat("-", chainId));
      }
    }
    transactionsProcessed += 1;

    const transferFunctions = txEvent.filterFunction(ERC20_TRANSFER_FUNCTION);

    // check for native token transfers
    if (to && value != "0x0" && data === "0x") {
      if (isRelevantChain) transfersCount++;
      // check only if the to address is not inside alertedAddresses
      if (!alertedAddresses.some((alertedAddress) => alertedAddress.address == to)) {
        if (await dataFetcher.isEoa(to)) {
          const hasHighNumberOfTotalTxs = await contractFetcher.getContractInfo(to, Number(chainId), false);
          if (!hasHighNumberOfTotalTxs) {
            const balance = await provider.getBalance(txEvent.transaction.from, txEvent.blockNumber);

            // if the account is drained
            if (balance.lt(ethers.BigNumber.from(ethers.utils.parseEther(networkManager.get("threshold"))))) {
              // check if "from" address was funded by "to" address before.
              const isFromFundedByTo = await contractFetcher.getFundInfo(from, to, Number(chainId));

              if (!isFromFundedByTo) {
                // check the amount in USD, if over 100$ update record
                const price = await priceFetcher.getValueInUsd(
                  txEvent.blockNumber,
                  Number(chainId),
                  value.toString(),
                  "native"
                );

                await updateRecord(from, to, networkManager.get("tokenName"), hash, price, transferObj);
              }

              // if there are multiple transfers to the same address, emit an alert
              if (transferObj[to].length > 2) {
                // check if the victims were initially funded by the same address
                const hasUniqueInitialFunders = await contractFetcher.checkInitialFunder(
                  transferObj[to],
                  Number(chainId)
                );

                if (hasUniqueInitialFunders) {
                  alertedAddresses = await persistenceHelper.load(
                    databaseKeys.alertedAddressesKey.concat("-", chainId)
                  );

                  if (!alertedAddresses.some((alertedAddress) => alertedAddress.address == to)) {
                    alertedAddresses.push({ address: to, timestamp: txEvent.timestamp });

                    if (isPersistenceTime) {
                      await persistenceHelper.persist(
                        alertedAddresses,
                        databaseKeys.alertedAddressesKey.concat("-", chainId)
                      );
                    }

                    // Add "from addresses" into the queue
                    transferObj[to].forEach((el) => {
                      queuedAddresses = queuedAddresses.filter((obj) => obj.transfer.from != el.victimAddress);

                      queuedAddresses.push({
                        timestamp: timestamp,
                        transfer: {
                          from: el.victimAddress,
                          to,
                          txHash: el.txHash,
                          asset: el.transferredAsset,
                        },
                      });
                    });

                    if (isPersistenceTime) {
                      await persistenceHelper.persist(
                        queuedAddresses,
                        databaseKeys.queuedAddressesKey.concat("-", chainId)
                      );
                    }

                    const totalTransferValue = transferObj[to].reduce((accumulator, object) => {
                      return accumulator + object.valueInUSD;
                    }, 0);

                    if (totalTransferValue > priceThreshold) {
                      const anomalyScore = await calculateAlertRate(
                        Number(chainId),
                        BOT_ID,
                        "PKC-3",
                        isRelevantChain ? ScanCountType.CustomScanCount : ScanCountType.TransferCount,
                        transfersCount
                      );

                      findings.push(
                        createFinding(
                          hash,
                          transferObj[to].map((el) => el.victimAddress),
                          to,
                          transferObj[to].map((el) => el.transferredAsset),
                          anomalyScore,
                          "PKC-3"
                        )
                      );
                    } else {
                      const anomalyScore = await calculateAlertRate(
                        Number(chainId),
                        BOT_ID,
                        "PKC-1",
                        isRelevantChain ? ScanCountType.CustomScanCount : ScanCountType.TransferCount,
                        transfersCount
                      );

                      findings.push(
                        createFinding(
                          hash,
                          transferObj[to].map((el) => el.victimAddress),
                          to,
                          transferObj[to].map((el) => el.transferredAsset),
                          anomalyScore,
                          "PKC-1"
                        )
                      );
                    }
                  }
                } else {
                  // if it's FP, remove them from the db
                  delete transferObj[to];

                  if (isPersistenceTime) {
                    await persistenceHelper.persist(transferObj, databaseKeys.transfersKey.concat("-", chainId));
                  }
                }
              }
            }
          }
        }
      }
    }

    // check for ERC20 transfers
    if (transferFunctions.length) {
      await Promise.all(
        transferFunctions.map(async (transfer) => {
          if (isRelevantChain) ercTransferCount++;

          // check top 100 tokens in the market
          const symbol = await dataFetcher.getSymbol(transfer.address, blockNumber);

          if (topTokens.includes(symbol)) {
            if (!alertedAddresses.some((alertedAddress) => alertedAddress.address == transfer.args.to)) {
              // check only if the to address is not inside alertedAddresses
              if (await dataFetcher.isEoa(transfer.args.to)) {
                const hasHighNumberOfTotalTxs = await contractFetcher.getContractInfo(
                  transfer.args.to,
                  Number(chainId),
                  true
                );

                if (!hasHighNumberOfTotalTxs) {
                  const balanceFrom = await balanceFetcher.getBalanceOf(from, transfer.address, txEvent.blockNumber);

                  if (balanceFrom.eq(0)) {
                    // check if "from" address was funded by "to" address before.
                    const isFromFundedByTo = await contractFetcher.getFundInfo(from, transfer.args.to, Number(chainId));

                    if (!isFromFundedByTo) {
                      // check the amount in USD, if over 100$ update record
                      const price = await priceFetcher.getValueInUsd(
                        txEvent.blockNumber,
                        Number(chainId),
                        transfer.args.amount.toString(),
                        transfer.address
                      );

                      await updateRecord(from, transfer.args.to, transfer.address, hash, price, transferObj);
                    }

                    // if there are multiple transfers to the same address, emit an alert
                    if (transferObj[transfer.args.to].length > 2) {
                      // check if the victims were initially funded by the same address
                      const hasUniqueInitialFunders = await contractFetcher.checkInitialFunder(
                        transferObj[transfer.args.to],
                        Number(chainId)
                      );

                      if (hasUniqueInitialFunders) {
                        alertedAddresses = await persistenceHelper.load(
                          databaseKeys.alertedAddressesKey.concat("-", chainId)
                        );

                        if (!alertedAddresses.some((alertedAddress) => alertedAddress.address == to)) {
                          alertedAddresses.push({
                            address: transfer.args.to,
                            timestamp: txEvent.timestamp,
                          });

                          if (isPersistenceTime) {
                            await persistenceHelper.persist(
                              alertedAddresses,
                              databaseKeys.alertedAddressesKey.concat("-", chainId)
                            );
                          }

                          // Add from addresses into the queue
                          transferObj[transfer.args.to].forEach((el) => {
                            queuedAddresses = queuedAddresses.filter((obj) => obj.transfer.from != el.victimAddress);

                            queuedAddresses.push({
                              timestamp: timestamp,
                              transfer: {
                                from: el.victimAddress,
                                to: transfer.args.to,
                                txHash: el.txHash,
                                asset: el.transferredAsset,
                              },
                            });
                          });

                          if (isPersistenceTime) {
                            await persistenceHelper.persist(
                              queuedAddresses,
                              databaseKeys.queuedAddressesKey.concat("-", chainId)
                            );
                          }

                          const totalTransferValue = transferObj[transfer.args.to].reduce((accumulator, object) => {
                            return accumulator + object.valueInUSD;
                          }, 0);

                          if (totalTransferValue > priceThreshold) {
                            const anomalyScore = await calculateAlertRate(
                              Number(chainId),
                              BOT_ID,
                              "PKC-3",
                              isRelevantChain ? ScanCountType.CustomScanCount : ScanCountType.ErcTransferCount,
                              ercTransferCount
                            );

                            findings.push(
                              createFinding(
                                hash,
                                transferObj[transfer.args.to].map((el) => el.victimAddress),
                                transfer.args.to,
                                transferObj[transfer.args.to].map((el) => el.transferredAsset),
                                anomalyScore,
                                "PKC-3"
                              )
                            );
                          } else {
                            const anomalyScore = await calculateAlertRate(
                              Number(chainId),
                              BOT_ID,
                              "PKC-1",
                              isRelevantChain ? ScanCountType.CustomScanCount : ScanCountType.ErcTransferCount,
                              ercTransferCount
                            );

                            findings.push(
                              createFinding(
                                hash,
                                transferObj[transfer.args.to].map((el) => el.victimAddress),
                                transfer.args.to,
                                transferObj[transfer.args.to].map((el) => el.transferredAsset),
                                anomalyScore,
                                "PKC-1"
                              )
                            );
                          }
                        }
                      } else {
                        // if it's FP, remove them from the db
                        delete transferObj[transfer.args.to];

                        if (isPersistenceTime) {
                          await persistenceHelper.persist(transferObj, databaseKeys.transfersKey.concat("-", chainId));
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        })
      );
    }

    return findings;
  };

export default {
  initialize: provideInitialize(
    networkManager,
    getEthersProvider(),
    new PersistenceHelper(DATABASE_URL),
    DATABASE_OBJECT_KEYS,
    new MarketCapFetcher(),
    createNewContractFetcher
  ),
  handleTransaction: provideHandleTransaction(
    getEthersProvider(),
    networkManager,
    new BalanceFetcher(getEthersProvider()),
    new DataFetcher(getEthersProvider()),
    new MarketCapFetcher(),
    new PriceFetcher(getEthersProvider()),
    new PersistenceHelper(DATABASE_URL),
    DATABASE_OBJECT_KEYS
  ),
};
