import { Finding, Initialize, TransactionEvent, ethers, getEthersProvider, BlockEvent } from "forta-agent";
import {
  NetworkData,
  Transfer,
  updateRecord,
  TIME_PERIOD,
  AlertedAddress,
  ERC20_TRANSFER_EVENT,
  deepMerge,
  MAX_OBJECT_SIZE,
} from "./utils";
import { NetworkManager } from "forta-agent-tools";
import { createFinding } from "./findings";
import calculateAlertRate, { ScanCountType } from "bot-alert-rate";
import BalanceFetcher from "./balance.fetcher";
import DataFetcher from "./data.fetcher";
import ContractFetcher from "./contract.fetcher";
import { PersistenceHelper } from "./persistence.helper";
import CONFIG from "./bot.config";
import { keys } from "./keys";
import { ZETTABLOCK_API_KEY } from "./keys";
import fetch from "node-fetch";

const DATABASE_URL = "https://research.forta.network/database/bot/";
const PK_COMP_TXNS_KEY = "nm-pk-comp-bot-key";
const BOT_ID = "0x6ec42b92a54db0e533575e4ebda287b7d8ad628b14a2268398fd4b794074ea03";

let chainId: string;
let transferObj: Transfer = {};
let alertedAddresses: AlertedAddress[] = [];
let isRelevantChain: boolean;
let transfersCount = 0;
let ercTransferCount = 0;
let transactionsProcessed = 0;

let lastBlock = 0;

const networkManager = new NetworkManager<NetworkData>(CONFIG);
let st = 0;

export const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider,
  persistenceHelper: PersistenceHelper,
  pkCompValueKey: string
): Initialize => {
  return async () => {
    await networkManager.init(provider);
    process.env["ZETTABLOCK_API_KEY"] = ZETTABLOCK_API_KEY;
    chainId = networkManager.getNetwork().toString();

    transferObj = await persistenceHelper.load(pkCompValueKey.concat("-", chainId));

    //  Optimism, Fantom & Avalanche not yet supported by bot-alert-rate package
    isRelevantChain = [10, 250, 43114].includes(Number(chainId));
  };
};

export const provideHandleTransaction =
  (
    provider: ethers.providers.Provider,
    networkManager: NetworkManager<NetworkData>,
    balanceFetcher: BalanceFetcher,
    contractFetcher: ContractFetcher,
    dataFetcher: DataFetcher,
    persistenceHelper: PersistenceHelper,
    pkCompValueKey: string
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
      const et = new Date().getTime();
      console.log(`Block processing time: ${et - st} ms`);
      const loadedTransferObj = await persistenceHelper.load(pkCompValueKey.concat("-", chainId));

      transferObj = deepMerge(transferObj, loadedTransferObj);

      // Remove alerted addresses from the object to be persisted into db
      if (alertedAddresses.length) {
        for (const el of alertedAddresses) {
          delete transferObj[el.address];
        }
      }

      alertedAddresses = alertedAddresses.filter((address) => timestamp - address.timestamp < TIME_PERIOD);

      lastBlock = blockNumber;
      console.log(`-----Transactions processed in block ${blockNumber - 7}: ${transactionsProcessed}-----`);
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

      await persistenceHelper.persist(transferObj, pkCompValueKey.concat("-", chainId));
    }
    transactionsProcessed += 1;

    const transferEvents = txEvent.filterLog(ERC20_TRANSFER_EVENT);

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
              await updateRecord(from, to, transferObj);

              // if there are multiple transfers to the same address, emit an alert
              if (transferObj[to].length > 3) {
                alertedAddresses.push({ address: to, timestamp: txEvent.timestamp });

                const anomalyScore = await calculateAlertRate(
                  Number(chainId),
                  BOT_ID,
                  "PKC-1",
                  isRelevantChain ? ScanCountType.CustomScanCount : ScanCountType.TransferCount,
                  transfersCount
                );
                findings.push(createFinding(hash, transferObj[to], to, anomalyScore));
              }
            }
          }
        }
      }
    }

    // check for ERC20 transfers
    if (transferEvents.length) {
      await Promise.all(
        transferEvents.map(async (transfer) => {
          if (isRelevantChain) ercTransferCount++;
          // check only if the to address is not inside alertedAddresses
          if (!alertedAddresses.some((alertedAddress) => alertedAddress.address == transfer.args.to)) {
            if (await dataFetcher.isEoa(transfer.args.to)) {
              const hasHighNumberOfTotalTxs = await contractFetcher.getContractInfo(
                transfer.args.to,
                Number(chainId),
                true
              );
              if (!hasHighNumberOfTotalTxs) {
                const balanceFrom = await balanceFetcher.getBalanceOf(
                  transfer.args.from,
                  transfer.address,
                  txEvent.blockNumber
                );

                if (balanceFrom.eq(0)) {
                  await updateRecord(transfer.args.from, transfer.args.to, transferObj);

                  // if there are multiple transfers to the same address, emit an alert
                  if (transferObj[transfer.args.to].length > 3) {
                    alertedAddresses.push({
                      address: transfer.args.to,
                      timestamp: txEvent.timestamp,
                    });

                    const anomalyScore = await calculateAlertRate(
                      Number(chainId),
                      BOT_ID,
                      "PKC-1",
                      isRelevantChain ? ScanCountType.CustomScanCount : ScanCountType.ErcTransferCount,
                      ercTransferCount
                    );
                    findings.push(createFinding(hash, transferObj[transfer.args.to], transfer.args.to, anomalyScore));
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
    PK_COMP_TXNS_KEY
  ),
  handleTransaction: provideHandleTransaction(
    getEthersProvider(),
    networkManager,
    new BalanceFetcher(getEthersProvider()),
    new ContractFetcher(getEthersProvider(), fetch, keys),
    new DataFetcher(getEthersProvider()),
    new PersistenceHelper(DATABASE_URL),
    PK_COMP_TXNS_KEY
  ),
};
