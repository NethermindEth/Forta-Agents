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
  TraceTracker,
  processReentrancyTraces
} from "./agent.utils";
import { PersistenceHelper } from "./persistence.helper";

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
  const longestPathCounter: Counter = {};
  const traceAddresses: TraceTracker = {};
  const reentrancyTraceAddresses: TraceTracker = {};
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
    longestPathCounter[addr] = 0;
    rootTracker[addr] = [];
  });

  const stack: [string, number][] = [];
  let currentDepth: number = 0;
  let currentLongestTrace: number = 0;

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

    // store root length for relative comparison prior to updating count
    const lastRootLength: number = rootTracker[to].length

    // check all scenarios that would cause last stored root path to be different than current
    const rootPathChanged: boolean =
      rootTracker[to].some((traceVal: number, index: number) => traceVal !== curStack[index]) ||
      (rootTracker[to].length === 0 && to !== txEvent.traces[0].action.to) ||
      rootTracker[to].length >= curStack.length;

    // reset counter, update last stored root path, and update current traces for metadata if changed
    if (rootPathChanged) {
      rootTracker[to] = curStack;
      currentCounter[to] = 0;
      traceAddresses[to] = [];
    }

    // store trace address arrays for metadata
    traceAddresses[to] = [...(traceAddresses[to] ?? []), curStack];

    // update reentrancy counters (only count reentrancy's 2+ levels deeper relative to root path)
    currentCounter[to] = (rootPathChanged || curStack.length - lastRootLength > 2) ? currentCounter[to] + 1 : currentCounter[to]
    maxReentrancyNumber[to] = Math.max(maxReentrancyNumber[to], currentCounter[to]);

    // track longest reentrancy trace for equal reentrancy counts
    longestPathCounter[to] = Math.max(longestPathCounter[to], curStack.length)
    currentLongestTrace = Math.max(...traceAddresses[to].map((trace: number[]) => trace.length));

    // only store trace address path for highest reentrancy
    reentrancyTraceAddresses[to] =
      (maxReentrancyNumber[to] === currentCounter[to] && longestPathCounter[to] === currentLongestTrace) ? traceAddresses[to] : reentrancyTraceAddresses[to];

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
      const reentrancyTracePaths = processReentrancyTraces(reentrancyTraceAddresses[addr]);
      findings.push(
        createFinding(
          addr,
          maxCount,
          severity,
          anomalyScore,
          confidenceLevel,
          reentrancyTracePaths,
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
