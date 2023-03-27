import {
  Finding,
  Initialize,
  TransactionEvent,
  ethers,
  getEthersProvider,
} from "forta-agent";
import { NetworkData, updateDB } from "./utils";
import { NetworkManager } from "forta-agent-tools";
import { createFinding } from "./findings";
import BalanceFetcher from "./balance.fetcher";
import { PersistenceHelper } from "./persistence.helper";
import CONFIG from "./agent.config";

const DATABASE_URL = "https://research.forta.network/database/bot/";
const PK_COMP_TXNS_KEY = "nm-private-key-compromise-bot-key";

let chainId: string;

export const ERC20_TRANSFER_EVENT =
  "event Transfer(address indexed from, address indexed to, uint256 value)";

const networkManager = new NetworkManager<NetworkData>(CONFIG);

export const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): Initialize => {
  return async () => {
    await networkManager.init(provider);
    chainId = networkManager.getNetwork().toString();
  };
};

export const provideHandleTransaction =
  (
    provider: ethers.providers.Provider,
    persistenceHelper: PersistenceHelper,
    pkCompValueKey: string
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
      const balance = await provider.getBalance(txEvent.transaction.from);

      // if the account is drained
      if (
        balance.lt(
          ethers.BigNumber.from(ethers.utils.parseEther(networkManager.get("threshold")))
        )
      ) {
        await updateDB(from, to, chainId, pkCompValueKey);

        const records: any = await persistenceHelper.load(
          pkCompValueKey.concat("-", chainId)
        );

        // if there are multiple transfers to the same address, emit an alert
        if (records[to].length > 3) {
          findings.push(createFinding(hash, records[to], to, 0.1));
        }
      }
    }

    // check for ERC20 transfers
    if (transferEvents.length) {
      await Promise.all(
        transferEvents.map(async transfer => {
          const balanceFetcher: BalanceFetcher = new BalanceFetcher(
            getEthersProvider(),
            transfer.address
          );

          const balanceFrom = await balanceFetcher.getBalanceOf(
            transfer.args.from,
            txEvent.blockNumber
          );

          if (balanceFrom.eq(0)) {
            await updateDB(transfer.args.from, transfer.args.to, chainId, pkCompValueKey);

            const records: any = await persistenceHelper.load(
              pkCompValueKey.concat("-", chainId)
            );

            // if there are multiple transfers to the same address, emit an alert
            if (records[transfer.args.to].length > 3) {
              findings.push(
                createFinding(hash, records[transfer.args.to], transfer.args.to, 0.1)
              );
            }
          }
        })
      );
    }

    const records: any = await persistenceHelper.load(
      pkCompValueKey.concat("-", chainId)
    );

    if (records) return findings;
  };

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(
    getEthersProvider(),
    new PersistenceHelper(DATABASE_URL),
    PK_COMP_TXNS_KEY
  ),
};
