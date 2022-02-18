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

const FACTORY: string = "0x918d7e714243F7d9d463C37e106235dCde294ffC"; // V1 address (no V2 deployed)
const FETCHER: PairFetcher = new PairFetcher(FACTORY, getEthersProvider());
const PAIRS: Set<string> = new Set<string>();

const ABI: string[] = [
  abi.FACTORY.getEvent("PairCreated").format("full"),
  ...(abi.PAIR.format("full") as string[]),
];

const initialize = async () => {
  const pairs: string[] = await FETCHER.getAllPairs("latest");
  pairs.forEach((pair) => PAIRS.add(pair));
};

export const provideHandleTransaction =
  (pairs: Set<string>, factory: string): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const logs: LogDescription[] = txEvent.filterLog(ABI);
    logs.forEach((log) => {
      if (log.name === "PairCreated") {
        if (log.address.toLowerCase() === factory) {
          pairs.add(log.args.pair.toLowerCase());
        }
      } else {
        if (pairs.has(log.address.toLowerCase())) {
          findings.push(createFinding(log));
        }
      }
    });

    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(PAIRS, FACTORY.toLowerCase()),
  initialize,
};
