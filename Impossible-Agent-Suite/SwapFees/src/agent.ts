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

export const provideHandleTransaction = (fetcher: PairFetcher): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const block: number = txEvent.blockNumber;

    const logs: LogDescription[] = txEvent.filterLog(abi.PAIR.format("full"));
    const isValid: boolean[] = await Promise.all(
      logs.map(log => fetcher.isImpossiblePair(block, log.address))
    );
    logs.forEach((log, i) => {
      if (isValid[i]) 
        findings.push(createFinding(log));
    });

    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(FETCHER),
};
