import { BlockEvent, Finding, getEthersProvider, HandleBlock } from "forta-agent";
import { BigNumber, utils, providers } from "ethers";
import DataFetcher from "./data.fetcher";
import { EVENT_ABI, createLargeBalanceFinding, BALANCE_THRESHOLD } from "./utils";
import NetworkData from "./network";
import NetworkManager, { NETWORK_MAP } from "./network";

let accounts: Set<string> = new Set<string>();
const networkManager = new NetworkManager(NETWORK_MAP);
const dataFetcher: DataFetcher = new DataFetcher(getEthersProvider(), networkManager);

export const provideInitialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
  dataFetcher.setGnanaContract();
};

export const provideHandleBlock =
  (
    nManager: NetworkData,
    fetcher: DataFetcher,
    balanceThreshold: BigNumber,
    accounts: Set<string>,
    provider2: providers.Provider
  ): HandleBlock =>
  async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    let Interface = new utils.Interface(EVENT_ABI);

    const filter = {
      address: nManager.gnana,
      topics: [Interface.getEventTopic("Transfer")],
      blockHash: blockEvent.blockHash,
    };
    const logArray = await provider2.getLogs(filter);
    let events = logArray.map((log) => Interface.parseLog(log));
    for (let event of events) {
      accounts.add(event.args.to);
    }

    for (let addr of Array.from(accounts.values())) {
      const balance: BigNumber = await fetcher.getBalance(addr, blockEvent.blockNumber);

      if (balance.gt(balanceThreshold)) {
        findings.push(createLargeBalanceFinding(addr, balance));
      }
    }

    accounts.clear();

    return findings;
  };

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleBlock: provideHandleBlock(networkManager, dataFetcher, BALANCE_THRESHOLD, accounts, getEthersProvider()),
};
