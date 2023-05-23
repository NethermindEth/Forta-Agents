import { Finding, Initialize, TransactionEvent, ethers, getEthersProvider, getAlerts } from "forta-agent";
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
import { createFinding } from "./findings";
import calculateAlertRate, { ScanCountType } from "bot-alert-rate";
import BalanceFetcher from "./balance.fetcher";
import DataFetcher from "./data.fetcher";
import ContractFetcher from "./contract.fetcher";
import MarketCapFetcher from "./marketcap.fetcher";
import { PersistenceHelper } from "./persistence.helper";
import CONFIG from "./bot.config";
import { keys } from "./keys";
import { ZETTABLOCK_API_KEY } from "./keys";
import fetch from "node-fetch";
import { AlertQueryOptions, AlertsResponse } from "forta-agent/dist/sdk/graphql/forta";

const DATABASE_URL = "https://research.forta.network/database/bot/";
const DATABASE_OBJECT_KEYS = {
  transfersKey: "nm-pk-comp-bot-key",
  alertedAddressesKey: "nm-pk-comp-bot-alerted-addresses-key",
  queuedAddressesKey: "nm-pk-comp-bot-queued-addresses-key",
};

const BOT_ID = "0x6ec42b92a54db0e533575e4ebda287b7d8ad628b14a2268398fd4b794074ea03";

let chainId: string;
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

export const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider,
  persistenceHelper: PersistenceHelper,
  databaseKeys: { transfersKey: string; alertedAddressesKey: string; queuedAddressesKey: string },
  marketCapFetcher: MarketCapFetcher
): Initialize => {
  return async () => {
    await networkManager.init(provider);
    process.env["ZETTABLOCK_API_KEY"] = ZETTABLOCK_API_KEY;
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
    contractFetcher: ContractFetcher,
    dataFetcher: DataFetcher,
    marketCapFetcher: MarketCapFetcher,
    persistenceHelper: PersistenceHelper,
    databaseKeys: { transfersKey: string; alertedAddressesKey: string; queuedAddressesKey: string },
    getAlerts: (query: AlertQueryOptions) => Promise<AlertsResponse>
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

    // fetch top tokens list sorted by market cap in every 6 hours
    if (blockNumber % 1800 == 0) {
      topTokens = await marketCapFetcher.getTopMarketCap();
    }

    // At the beginning of the block
    if (blockNumber != lastBlock) {
      const et = new Date().getTime();
      console.log(`Block processing time: ${et - st} ms`);
      const loadedTransferObj = await persistenceHelper.load(databaseKeys.transfersKey.concat("-", chainId));
      alertedAddresses = await persistenceHelper.load(databaseKeys.alertedAddressesKey.concat("-", chainId));
      queuedAddresses = await persistenceHelper.load(databaseKeys.queuedAddressesKey.concat("-", chainId));

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

      await persistenceHelper.persist(transferObj, databaseKeys.transfersKey.concat("-", chainId));
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
              await updateRecord(from, to, networkManager.get("tokenName"), transferObj);

              // if there are multiple transfers to the same address, emit an alert
              if (transferObj[to].length > 3) {
                alertedAddresses = await persistenceHelper.load(databaseKeys.alertedAddressesKey.concat("-", chainId));

                if (!alertedAddresses.some((alertedAddress) => alertedAddress.address == to)) {
                  alertedAddresses.push({ address: to, timestamp: txEvent.timestamp });

                  await persistenceHelper.persist(
                    alertedAddresses,
                    databaseKeys.alertedAddressesKey.concat("-", chainId)
                  );

                  const anomalyScore = await calculateAlertRate(
                    Number(chainId),
                    BOT_ID,
                    "PKC-1",
                    isRelevantChain ? ScanCountType.CustomScanCount : ScanCountType.TransferCount,
                    transfersCount
                  );

                  transferObj[to].forEach((el) => {
                    queuedAddresses.push({ address: el.victimAddress, timestamp: timestamp, txHash: hash });
                  });

                  findings.push(
                    createFinding(
                      hash,
                      transferObj[to].map((el) => el.victimAddress),
                      to,
                      transferObj[to].map((el) => el.transferredAsset),
                      anomalyScore
                    )
                  );
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
                    await updateRecord(from, transfer.args.to, transfer.address, transferObj);

                    // if there are multiple transfers to the same address, emit an alert
                    if (transferObj[transfer.args.to].length > 3) {
                      alertedAddresses = await persistenceHelper.load(
                        databaseKeys.alertedAddressesKey.concat("-", chainId)
                      );

                      if (!alertedAddresses.some((alertedAddress) => alertedAddress.address == to)) {
                        alertedAddresses.push({
                          address: transfer.args.to,
                          timestamp: txEvent.timestamp,
                        });
                        await persistenceHelper.persist(
                          alertedAddresses,
                          databaseKeys.alertedAddressesKey.concat("-", chainId)
                        );

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
                            anomalyScore
                          )
                        );
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
    new MarketCapFetcher()
  ),
  handleTransaction: provideHandleTransaction(
    getEthersProvider(),
    networkManager,
    new BalanceFetcher(getEthersProvider()),
    new ContractFetcher(getEthersProvider(), fetch, keys),
    new DataFetcher(getEthersProvider()),
    new MarketCapFetcher(),
    new PersistenceHelper(DATABASE_URL),
    DATABASE_OBJECT_KEYS,
    getAlerts
  ),
};
