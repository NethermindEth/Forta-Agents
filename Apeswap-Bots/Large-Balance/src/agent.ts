import {
  BlockEvent,
  Finding,
  TransactionEvent,
  getEthersProvider,
  HandleTransaction,
  HandleBlock,
  LogDescription,
} from "forta-agent";
import { BigNumber } from "ethers";
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

export function provideHandleTransaction(
  fetcher: DataFetcher,
  accounts: Set<string>
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const logs: LogDescription[] = txEvent.filterLog(
      EVENT_ABI,
      fetcher.gnanaTokenAddress
    );
    for (const log of logs) {
      const toAddress = log.args.to;
      accounts.add(toAddress);
    }
    return findings;
  };
}
export function provideHandleBlock(
  fetcher: DataFetcher,
  balanceThreshold: BigNumber,
  accounts: Set<string>
): HandleBlock {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
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
  handleTransaction: provideHandleTransaction(FETCHER, accounts),
  handleBlock: provideHandleBlock(FETCHER, BALANCE_THRESHOLD, accounts),
};
