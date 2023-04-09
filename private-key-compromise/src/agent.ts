import { Finding, Initialize, TransactionEvent, ethers, getEthersProvider, BlockEvent } from "forta-agent";
import { NetworkData, Transfer, updateRecord, TIME_PERIOD, AlertedAddress, ERC20_TRANSFER_EVENT } from "./utils";
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

const DATABASE_URL = "https://research.forta.network/database/bot/";
const PK_COMP_TXNS_KEY = "nm-private-key-compromise-bot-key";
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
    dataFetcher: DataFetcher
  ) =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    if (txEvent.blockNumber != lastBlock) {
      lastBlock = txEvent.blockNumber;
      console.log(`----Transactions processed in block ${txEvent.blockNumber - 1}: ${transactionsProcessed}----`);
      transactionsProcessed = 0;
    }
    transactionsProcessed += 1;

    const transferEvents = txEvent.filterLog(ERC20_TRANSFER_EVENT);

    const {
      hash,
      from,
      to,
      transaction: { value, data },
    } = txEvent;

    // check for native token transfers
    if (to && value != "0x0" && data === "0x") {
      if (isRelevantChain) transfersCount++;
      // check only if the to address is not inside alertedAddresses
      if (!alertedAddresses.some((alertedAddress) => alertedAddress.address == to)) {
        const hasHighNumberOfTotalTxs = await contractFetcher.getContractInfo(
          to,
          Number(chainId),
          false,
          txEvent.blockNumber
        );

        if ((await dataFetcher.isEoa(to)) && !hasHighNumberOfTotalTxs) {
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

    // check for ERC20 transfers
    if (transferEvents.length) {
      await Promise.all(
        transferEvents.map(async (transfer) => {
          if (isRelevantChain) ercTransferCount++;
          // check only if the to address is not inside alertedAddresses
          if (!alertedAddresses.some((alertedAddress) => alertedAddress.address == transfer.args.to)) {
            const hasHighNumberOfTotalTxs = await contractFetcher.getContractInfo(
              transfer.args.to,
              Number(chainId),
              true,
              txEvent.blockNumber
            );

            if ((await dataFetcher.isEoa(transfer.args.to)) && !hasHighNumberOfTotalTxs) {
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
        })
      );
    }

    return findings;
  };

export function provideHandleBlock(persistenceHelper: PersistenceHelper, pkCompValueKey: string) {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    if (blockEvent.blockNumber % 300 === 0) {
      await persistenceHelper.persist(transferObj, pkCompValueKey.concat("-", chainId));
    }

    alertedAddresses = alertedAddresses.filter(
      (address) => blockEvent.block.timestamp - address.timestamp < TIME_PERIOD
    );

    return findings;
  };
}

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
    new ContractFetcher(getEthersProvider(), keys),
    new DataFetcher(getEthersProvider())
  ),
  handleBlock: provideHandleBlock(new PersistenceHelper(DATABASE_URL), PK_COMP_TXNS_KEY),
};
