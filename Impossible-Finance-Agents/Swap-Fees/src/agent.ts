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

const FACTORY: string = "0x86f9944711526af414683033E5846E92b721191A"; // PoC Factory in Goerli
const FETCHER: PairFetcher = new PairFetcher(FACTORY, getEthersProvider());

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
