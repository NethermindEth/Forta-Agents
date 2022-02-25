import {
  Finding,
  getEthersProvider,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import OracleFetcher from "./oracle.fetcher";
import { EVENTS_SIGNATURES, createFinding } from "./utils";

const MODULE_ADDRESS: string = "0x0eBaC21F7f6A6599B5fa5f57Baaa974ADFEC4613";
const FETCHER = new OracleFetcher(getEthersProvider());
let oracle: string = "";

export const initialize =
  (reality_module: string, fetcher: OracleFetcher) => async () => {
    oracle = await fetcher.getOracle("latest", reality_module);
  };

export const provideHandleTransaction =
  (_oracle: string): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    // get events logs on the oracle.
    txEvent.filterLog(EVENTS_SIGNATURES, _oracle).map((log) => {
      findings.push(createFinding(log));
    });

    return findings;
  };

export default {
  initialize: initialize(MODULE_ADDRESS, FETCHER),
  handleTransaction: provideHandleTransaction(oracle),
};
