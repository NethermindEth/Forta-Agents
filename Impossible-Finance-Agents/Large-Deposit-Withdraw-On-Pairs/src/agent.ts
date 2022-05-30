import { Finding, HandleTransaction, TransactionEvent, getEthersProvider, LogDescription } from "forta-agent";
import abi from "./abi";
import createFinding from "./findings";
import PairFetcher from "./pairs.fetcher";
import { BigNumber } from "ethers";

const PERCENT: number = 10; // Large percent
const FACTORY: string = "0x4233ad9b8b7c1ccf0818907908a7f0796a3df85f";
const FETCHER: PairFetcher = new PairFetcher(FACTORY, getEthersProvider());

export const provideHandleTransaction =
  (fetcher: PairFetcher, percent: number): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const logs: LogDescription[] = txEvent.filterLog(abi.PAIR.format("full"));
    for (let log of logs) {
      if (await fetcher.isImpossiblePair(txEvent.blockNumber, log.address.toLowerCase())) {
        const { reserve0, reserve1 } = await fetcher.getReserves(
          txEvent.blockNumber - 1, // reserves at the beginning of the current block
          log.address.toLowerCase()
        );
        const high0: BigNumber = BigNumber.from(percent).mul(reserve0).div(100);
        const high1: BigNumber = BigNumber.from(percent).mul(reserve1).div(100);
        if (high0.lte(log.args.amount0) || high1.lte(log.args.amount1))
          findings.push(createFinding(log, reserve0, reserve1));
      }
    }

    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(FETCHER, PERCENT),
};
