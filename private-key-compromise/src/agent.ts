import {
  Finding,
  Initialize,
  TransactionEvent,
  ethers,
  getEthersProvider,
} from "forta-agent";
import { NetworkData } from "./utils";
import { NetworkManager } from "forta-agent-tools";
import { createFinding } from "./findings";
import { PersistenceHelper } from "./persistence.helper";
import CONFIG from "./agent.config";

const DATABASE_URL = "https://research.forta.network/database/bot/";
const PK_COMP_TXNS_KEY = "nm-private-key-compromise-bot-key";

let chainId: string;
let pkCompValueRecord: {};

export const ERC20_TRANSFER_EVENT =
  "event Transfer(address indexed from, address indexed to, uint256 value)";

const networkManager = new NetworkManager<NetworkData>(CONFIG);

export const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider,
  persistenceHelper: PersistenceHelper,
  pkCompValueKey: any
): Initialize => {
  return async () => {
    await networkManager.init(provider);
    chainId = networkManager.getNetwork().toString();

    pkCompValueRecord = await persistenceHelper.load(pkCompValueKey.concat("-", chainId));

    console.log("init", pkCompValueRecord);

    // allTxnsWithValue = await persistenceHelper.load(anyValueKey.concat("-", chainId));
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

    // const value = ethers.utils.formatEther(txEvent.transaction.value);
    const {
      hash,
      from,
      to,
      transaction: { value, data },
    } = txEvent;

    // check for ERC20 transfers
    // await Promise.all(transferEvents.map(async transfer => {}));

    // check for native token transfers

    if (to && value != "0x0" && data === "0x") {
      console.log("hash", hash);
      console.log("from", from);
      console.log("to", to);
      console.log("value", value);
      console.log("data", data);

      // const balance = ethers.utils.formatEther(
      //   await provider.getBalance(txEvent.transaction.from)
      // );

      const balance = await provider.getBalance(txEvent.transaction.from);
      console.log("balance", ethers.utils.formatEther(balance));

      // if the account is drained
      if (
        balance.lt(
          ethers.BigNumber.from(ethers.utils.parseEther(networkManager.get("threshold")))
        )
      ) {
        const records: any = await persistenceHelper.load(
          pkCompValueKey.concat("-", chainId)
        );
        console.log("records", records);

        let transferObj: any = {};

        // if this is the first time and there's no record in db
        if (!Object.keys(records).length) {
          transferObj[to] = [from];

          await persistenceHelper.persist(
            transferObj,
            pkCompValueKey.concat("-", chainId)
          );
        } else {
          const records: any = await persistenceHelper.load(
            pkCompValueKey.concat("-", chainId)
          );

          if (records[to] && !records[to].includes(from)) {
            records[to].push(from);
            transferObj[to] = records[to];

            await persistenceHelper.persist(
              transferObj,
              pkCompValueKey.concat("-", chainId)
            );
          } else if (!records[to]) {
            records[to] = [from];
            transferObj = records;

            await persistenceHelper.persist(
              transferObj,
              pkCompValueKey.concat("-", chainId)
            );
          }
        }

        // findings.push(createFinding(hash, [from], to, 0.1));
      }

      console.log(
        "zort",
        await persistenceHelper.load(pkCompValueKey.concat("-", chainId))
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
    new PersistenceHelper(DATABASE_URL),
    PK_COMP_TXNS_KEY
  ),
};
