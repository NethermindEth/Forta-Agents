import {
  BlockEvent,
  Finding,
  getEthersProvider,
  HandleBlock,
} from "forta-agent";
import { BigNumber, utils, providers } from "ethers";
import DataFetcher from "./data.fetcher";
import {
  GNANA_TOKEN_CONTRACT,
  EVENT_ABI,
  createLargeBalanceFinding,
  BALANCE_THRESHOLD,
} from "./utils";

const FETCHER: DataFetcher = new DataFetcher(
  GNANA_TOKEN_CONTRACT,
  getEthersProvider()
);
let accounts: Set<string> = new Set<string>();

export function provideHandleBlock(
  fetcher: DataFetcher,
  balanceThreshold: BigNumber,
  accounts: Set<string>,
  provider: providers.Provider
): HandleBlock {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    let Interface = new utils.Interface(EVENT_ABI);

    const filter = {
      address: GNANA_TOKEN_CONTRACT,
      topics: [Interface.getEventTopic("Transfer")],
      blockHash: blockEvent.blockHash,
    };
    const logArray = await provider.getLogs(filter);
    let events = logArray.map((log) => Interface.parseLog(log));
    for (let event of events) {
      accounts.add(event.args.to);
    }

    for (let addr of Array.from(accounts.values())) {
      const balance: BigNumber = await fetcher.getBalance(
        addr,
        blockEvent.blockNumber
      );

      if (balance.gt(balanceThreshold)) {
        findings.push(createLargeBalanceFinding(addr, balance));
      }
    }
    return findings;
  };
}

export default {
  handleBlock: provideHandleBlock(
    FETCHER,
    BALANCE_THRESHOLD,
    accounts,
    getEthersProvider()
  ),
};
