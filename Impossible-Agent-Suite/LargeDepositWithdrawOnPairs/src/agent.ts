import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  getEthersProvider,
  LogDescription,
} from "forta-agent";
import abi from "./abi";
import createFinding from "./findings";
import PairFetcher from "./pairs.fetcher";
import { BigNumber } from "ethers";

const PERCENT: number = 10; // Large percent
const FACTORY: string = "0x918d7e714243F7d9d463C37e106235dCde294ffC";
const FETCHER: PairFetcher = new PairFetcher(FACTORY, getEthersProvider());
const PAIRS: Set<string> = new Set<string>();

const ABI: string[] = [
  abi.FACTORY.getEvent("PairCreated").format("full"),
  abi.PAIR.getEvent("Mint").format("full"),
  abi.PAIR.getEvent("Burn").format("full"),
];

const initialize = async () => {
  const pairs: string[] = await FETCHER.getAllPairs("latest");
  pairs.forEach((pair) => PAIRS.add(pair));
};

export const provideHandleTransaction =
  (pairs: Set<string>, fetcher: PairFetcher, percent: number): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const logs: LogDescription[] = txEvent.filterLog(ABI);
    for (let log of logs) {
      if (log.name === "PairCreated") {
        if (log.address.toLowerCase() === fetcher.factory) {
          pairs.add(log.args.pair.toLowerCase());
        }
      } else {
        if (!pairs.has(log.address.toLowerCase())) continue;
        const { reserve0, reserve1 } = await fetcher.getReserves(
          txEvent.blockNumber,
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
  handleTransaction: provideHandleTransaction(PAIRS, FETCHER, PERCENT),
  initialize,
};
