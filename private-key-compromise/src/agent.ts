import {
  Finding,
  Initialize,
  TransactionEvent,
  ethers,
  getEthersProvider,
  BlockEvent,
} from "forta-agent";
import {
  NetworkData,
  Transfer,
  updateRecord,
  TIME_PERIOD,
  AlertedAddress,
  ERC20_TRANSFER_EVENT,
} from "./utils";
import { NetworkManager } from "forta-agent-tools";
import { createFinding } from "./findings";
import BalanceFetcher from "./balance.fetcher";
import DataFetcher from "./data.fetcher";
import ContractFetcher from "./contract.fetcher";
import { PersistenceHelper } from "./persistence.helper";
import CONFIG from "./bot.config";
import { keys } from "./keys";

const DATABASE_URL = "https://research.forta.network/database/bot/";
const PK_COMP_TXNS_KEY = "nm-private-key-compromise-bot-key";

let chainId: string;
let transferObj: Transfer = {};
let alertedAddresses: AlertedAddress[] = [];

const networkManager = new NetworkManager<NetworkData>(CONFIG);

export const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider,
  persistenceHelper: PersistenceHelper,
  pkCompValueKey: string
): Initialize => {
  return async () => {
    await networkManager.init(provider);
    chainId = networkManager.getNetwork().toString();
    console.log("chainId", chainId);

    transferObj = await persistenceHelper.load(pkCompValueKey.concat("-", chainId));
    console.log("transferObj in memory:", transferObj);
  };
};

export const provideHandleTransaction =
  (
    provider: ethers.providers.Provider,
    networkManager: NetworkManager<NetworkData>,
    balanceFetcher: BalanceFetcher,
    contractFetcher: ContractFetcher
  ) =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    const transferEvents = txEvent.filterLog(ERC20_TRANSFER_EVENT);

    const {
      hash,
      from,
      to,
      transaction: { value, data },
    } = txEvent;

    // check for native token transfers
    if (to && value != "0x0" && data === "0x") {
      // check only if the to address is not inside alertedAddresses
      if (!alertedAddresses.some(alertedAddress => alertedAddress.address == to)) {
        const dataFetcher: DataFetcher = new DataFetcher(getEthersProvider());
        const hasHighNumberOfTotalTxs = await contractFetcher.getContractInfo(
          to,
          Number(chainId),
          txEvent.blockNumber
        );

        if ((await dataFetcher.isEoa(to)) && !hasHighNumberOfTotalTxs) {
          const balance = await provider.getBalance(
            txEvent.transaction.from,
            txEvent.blockNumber
          );

          // if the account is drained
          if (
            balance.lt(
              ethers.BigNumber.from(
                ethers.utils.parseEther(networkManager.get("threshold"))
              )
            )
          ) {
            await updateRecord(from, to, transferObj);

            // if there are multiple transfers to the same address, emit an alert
            if (transferObj[to].length > 3) {
              alertedAddresses.push({ address: to, timestamp: txEvent.timestamp });
              findings.push(createFinding(hash, transferObj[to], to, 0.1));
            }
          }
        }
      }
    }

    // check for ERC20 transfers
    if (transferEvents.length) {
      await Promise.all(
        transferEvents.map(async transfer => {
          // check only if the to address is not inside alertedAddresses

          if (
            !alertedAddresses.some(
              alertedAddress => alertedAddress.address == transfer.args.to
            )
          ) {
            const dataFetcher: DataFetcher = new DataFetcher(getEthersProvider());
            const hasHighNumberOfTotalTxs = await contractFetcher.getContractInfo(
              transfer.args.to,
              Number(chainId),
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

                  findings.push(
                    createFinding(
                      hash,
                      transferObj[transfer.args.to],
                      transfer.args.to,
                      0.1
                    )
                  );
                }
              }
            }
          }
        })
      );
    }

    // console.log("", transferObj);

    return findings;
  };

export function provideHandleBlock(
  persistenceHelper: PersistenceHelper,
  pkCompValueKey: string
) {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    if (blockEvent.blockNumber % 300 === 0) {
      console.log("transfer obj in bloc k", transferObj);

      await persistenceHelper.persist(transferObj, pkCompValueKey.concat("-", chainId));
    }

    alertedAddresses = alertedAddresses.filter(
      address => blockEvent.block.timestamp - address.timestamp < TIME_PERIOD
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
    new ContractFetcher(getEthersProvider(), keys)
  ),
  handleBlock: provideHandleBlock(new PersistenceHelper(DATABASE_URL), PK_COMP_TXNS_KEY),
};
