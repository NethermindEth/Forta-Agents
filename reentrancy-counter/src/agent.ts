import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  Trace,
  FindingSeverity,
  ethers,
  getEthersProvider,
  BlockEvent,
  Initialize,
} from "forta-agent";
import {
  Counter,
  reentrancyLevel,
  createFinding,
  getAnomalyScore,
  getConfidenceLevel,
  RootTracker,
} from "./agent.utils";
import { PersistenceHelper } from "./persistence.helper";
import { TraceTracker } from "./agent.utils";

const DETECT_REENTRANT_CALLS_PER_THRESHOLD_KEY: string = "nm-reentrancy-counter-reentranct-calls-per-threshold-key";
const TOTAL_TXS_WITH_TRACES_KEY: string = "nm-reentrancy-counter-total-txs-with-traces-key";

const DATABASE_URL = "https://research.forta.network/database/bot/";

let reentrantCallsPerSeverity: Counter = {
  Info: 0,
  Low: 0,
  Medium: 0,
  High: 0,
  Critical: 0,
};

let totalTxsWithTraces: number = 0;
let chainId: string;

export const thresholds: [number, FindingSeverity][] = [
  [3, FindingSeverity.Info],
  [5, FindingSeverity.Low],
  [7, FindingSeverity.Medium],
  [9, FindingSeverity.High],
  [11, FindingSeverity.Critical],
];

const provideInitialize = (
  provider: ethers.providers.Provider,
  persistenceHelper: PersistenceHelper,
  detectReentrantCallsKey: string,
  totalTxsKey: string
): Initialize => {
  return async () => {
    chainId = (await provider.getNetwork()).chainId.toString();

    totalTxsWithTraces = (await persistenceHelper.load(totalTxsKey.concat("-", chainId))) as number;
    reentrantCallsPerSeverity = (await persistenceHelper.load(detectReentrantCallsKey.concat("-", chainId))) as Counter;
  };
};

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  const findings: Finding[] = [];

  const maxReentrancyNumber: Counter = {};
  const currentCounter: Counter = {};
  const traceAddresses: TraceTracker = {};
  const rootTracker: RootTracker = {};

  // Update the total number of transactions with traces counter
  if (txEvent.traces.length > 0) {
    totalTxsWithTraces += 1;
  }

  // Add the addresses to the counters
  const addresses: string[] = [];
  txEvent.traces.forEach((trace: Trace) => {
    addresses.push(trace.action.to);
  });
  addresses.forEach((addr: string) => {
    maxReentrancyNumber[addr] = 1;
    currentCounter[addr] = 0;
    rootTracker[addr] = [];
  });

  const stack: [string, number][] = [];
  let currentDepth: number = 0;

  // Review the traces stack
  txEvent.traces.forEach((trace: Trace) => {
    const curStack: number[] = trace.traceAddress;
    const to: string = trace.action.to;

    // update call counts for next trace with calls at previous or equal depth in call stack
    while (currentDepth >= curStack.length && stack.length > 0) {
      const topTraceLength = stack[stack.length - 1][1];
      if (topTraceLength >= curStack.length) {
        // @ts-ignore
        const [last, lastTraceLength] = stack.pop();
        const sameRootPath: boolean = rootTracker[last].every(
          (traceVal: number, index: number) => traceVal === curStack[index]
        );
        currentDepth = lastTraceLength;
        currentCounter[last] = sameRootPath ? currentCounter[last] : currentCounter[last] - 1;
      }
      currentDepth -= 1;
    }
    currentDepth += 1;

    // update the base call path to count reentries from if changed
    const rootPathChanged: boolean = rootTracker[to].some(
      (traceVal: number, index: number) => traceVal !== curStack[index]
    );
    rootTracker[to] =
      rootTracker[to].length === 0 || rootTracker[to].length >= curStack.length || rootPathChanged
        ? curStack
        : rootTracker[to];
    
    // store trace address arrays for metadata
    traceAddresses[to] = [...(traceAddresses[to] ?? []), curStack];

    currentCounter[to] += 1;
    maxReentrancyNumber[to] = Math.max(maxReentrancyNumber[to], currentCounter[to]);

    stack.push([to, curStack.length]);
  });

  // Create findings if needed
  for (const addr in maxReentrancyNumber) {
    const maxCount: number = maxReentrancyNumber[addr];
    const [report, severity] = reentrancyLevel(maxCount, thresholds);
    if (report) {
      let anomalyScore = getAnomalyScore(reentrantCallsPerSeverity, totalTxsWithTraces, severity);
      anomalyScore = Math.min(1, anomalyScore);
      const confidenceLevel = getConfidenceLevel(severity);
      const reentrancyTraceAddresses = JSON.stringify(traceAddresses[addr]);
      findings.push(
        createFinding(
          addr,
          maxCount,
          severity,
          anomalyScore,
          confidenceLevel,
          reentrancyTraceAddresses,
          txEvent.hash,
          txEvent.from
        )
      );
    }
  }
  return findings;
};

const provideHandleBlock = (
  persistenceHelper: PersistenceHelper,
  detectReentrantCallsKey: string,
  totalTxsKey: string
) => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    if (blockEvent.blockNumber % 240 === 0) {
      await persistenceHelper.persist(reentrantCallsPerSeverity, detectReentrantCallsKey.concat("-", chainId));
      await persistenceHelper.persist(totalTxsWithTraces, totalTxsKey.concat("-", chainId));
    }

    return findings;
  };
};

export default {
  initialize: provideInitialize(
    getEthersProvider(),
    new PersistenceHelper(DATABASE_URL),
    DETECT_REENTRANT_CALLS_PER_THRESHOLD_KEY,
    TOTAL_TXS_WITH_TRACES_KEY
  ),
  provideInitialize,
  handleTransaction,
  handleBlock: provideHandleBlock(
    new PersistenceHelper(DATABASE_URL),
    DETECT_REENTRANT_CALLS_PER_THRESHOLD_KEY,
    TOTAL_TXS_WITH_TRACES_KEY
  ),
  provideHandleBlock,
};
