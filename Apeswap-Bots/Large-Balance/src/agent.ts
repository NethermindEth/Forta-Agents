import {
  Finding,
  TransactionEvent,
  getEthersProvider,
  HandleTransaction,
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

export const provideHandleTransaction =
  (fetcher: DataFetcher, balanceThreshold: BigNumber): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const logs: LogDescription[] = txEvent.filterLog(
      EVENT_ABI,
      fetcher.gnanaTokenAddress
    );

    for (const log of logs) {
      const toAddress = log.args.to;
      const balance: BigNumber= await fetcher.getBalance(toAddress, txEvent.blockNumber);

      if (balance.gt(balanceThreshold)) {
        findings.push(createLargeBalanceFinding(toAddress, balance));
      }
    }

    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(FETCHER, BALANCE_THRESHOLD),
};
