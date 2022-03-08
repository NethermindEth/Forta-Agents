import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  getJsonRpcUrl,
} from "forta-agent";
import {
  provideFunctionCallsDetectorHandler,
  provideEventCheckerHandler,
} from "forta-agent-tools";
import {
  createFindingCallDetector,
  createFindingEventDetector,
  getPoolAccountants,
  hasLosses,
} from "./utils";
import Web3 from "web3";
const web3: Web3 = new Web3(getJsonRpcUrl());
import { reportLossABI, earningReportedSignature } from "./abi";
import TimeTracker from './time.tracker';
import LRU from "lru-cache";

const cache: LRU<string, string[]> = new LRU<string, string[]>({ max: 100 });
const tracker: TimeTracker = new TimeTracker();
const ONE_HOUR: number = 3600000; // one hour in miliseconds
const POOL_ACCOUNTANTS_KEY = "_poolAccountants"

export const loadPoolAccountants = async (web3: Web3, blockNumber: number): Promise<string[]> => {
  const currentTime = Date.now()
  const [success, time] = tracker.tryGetLastTime(POOL_ACCOUNTANTS_KEY);
  if (!success || (currentTime - time >= ONE_HOUR)) {
    const poolAccountant: string[] = await getPoolAccountants(
      web3,
      blockNumber
    );
    tracker.update(POOL_ACCOUNTANTS_KEY, currentTime);
    cache.set(POOL_ACCOUNTANTS_KEY, poolAccountant)
    return poolAccountant;
  }
  return cache.get(POOL_ACCOUNTANTS_KEY) || []
}

export const provideHandleTransaction = (web3: Web3): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const poolAccountant: string[] = await loadPoolAccountants(
      web3, txEvent.blockNumber
    );
    const reportLossHandlers: HandleTransaction[] = poolAccountant.map(
      (poolAccountant) =>
        provideFunctionCallsDetectorHandler(
          createFindingCallDetector,
          reportLossABI,
          {
            to: poolAccountant,
            filterOnArguments: (args: { [key: string]: any }): boolean => {
              return args[1] > 0
            }
          }
        )
    );

    const reportEarningEventWithLoss: HandleTransaction[] = poolAccountant.map(
      (poolAccountant) =>
        provideEventCheckerHandler(
          createFindingEventDetector,
          earningReportedSignature,
          poolAccountant,
          hasLosses
        )
    );

    let findings: Finding[] = [];

    for (let reportLossHandler of reportLossHandlers) {
      const result = await reportLossHandler(txEvent)
      findings = findings.concat(result);
    }

    for (let reportEarningReportedEvent of reportEarningEventWithLoss) {
      findings = findings.concat(await reportEarningReportedEvent(txEvent));
    }

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(web3),
};
