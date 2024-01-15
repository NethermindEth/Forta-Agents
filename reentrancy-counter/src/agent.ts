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
  TraceAddressInstances,
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

/*
const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  const findings: Finding[] = [];

  const maxReentrancyNumber: Counter = {};
  const currentCounter: Counter = {};
  const contractTraceAddressInstances: TraceAddressInstances = {};

  // Update the total number of transactions with traces counter
  if (txEvent.traces.length > 0) {
    totalTxsWithTraces += 1;
  }

  // Add the addresses to the counters
  const addresses: string[] = [];
  txEvent.traces.forEach((trace: Trace) => {
    // Prevent duplicate addresses
    if(!addresses.includes(trace.action.to)) addresses.push(trace.action.to);
  });
  addresses.forEach((addr: string) => {
    maxReentrancyNumber[addr] = 1;
    currentCounter[addr] = 0;
    contractTraceAddressInstances[addr] = [];
  });

  const traceRecipients: string[] = [];

  // Review the traces stack
  txEvent.traces.forEach((trace: Trace) => {
    const currentTraceAddess: number[] = trace.traceAddress;
    while (traceRecipients.length > currentTraceAddess.length) {
      // @ts-ignore
      const last: string = traceRecipients.pop();
      currentCounter[last] -= 1;
    }
    const to: string = trace.action.to;
    currentCounter[to] += 1;
    maxReentrancyNumber[to] = Math.max(maxReentrancyNumber[to], currentCounter[to]);
    contractTraceAddressInstances[to].push(currentTraceAddess);
    traceRecipients.push(to);
  });

  // Create findings if needed
  for (const addr in maxReentrancyNumber) {
    const maxCount: number = maxReentrancyNumber[addr];
    const addrTraceAddressInstances: number[][] = contractTraceAddressInstances[addr];
    const [report, severity] = reentrancyLevel(maxCount, thresholds);
    if (report) {
      let anomalyScore = getAnomalyScore(reentrantCallsPerSeverity, totalTxsWithTraces, severity);
      anomalyScore = Math.min(1, anomalyScore);
      const confidenceLevel = getConfidenceLevel(severity);
      findings.push(
        createFinding(
          addr,
          maxCount,
          severity,
          anomalyScore,
          confidenceLevel,
          txEvent.hash,
          txEvent.from,
          addrTraceAddressInstances
        )
      );
    }
  }
  return findings;
};
*/

type TraceNode = {
  parent?: string;
  self: string;
  child?: TraceNode;
  traceInstance?: boolean;
};

type TraceTree = {
  // key is `address`
  [key: string]: {
    traceTree: {
      [key:string]: TraceNode
    }
  }
}

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  const findings: Finding[] = [];

  // Update the total number of transactions with traces counter
  if (txEvent.traces.length > 0) {
    totalTxsWithTraces += 1;
  }

  // TODO: Look up how to create algorithm
  // to traverse down the tree.
  const traceTreePerAddress: TraceTree = {};

  /*
  { to: "0x4", traceAddress: [0, 1] }
  { to: "0x4", traceAddress: [0, 1, 0, 0, 0] }
  */
  function checkTrace(traceNode: TraceNode, traceAddress: number[], i: number): any {
    // If we are at the root trace...
    if(i === 0) {
      let nextIndex = i;
      nextIndex++;
      const nextTrace = traceAddress[nextIndex].toString();

      // Check if `nextTrace` is the child of
      // of the `rootTrace` and return that
      // along with the _first_ first child
      // trace node.
      //
      // Note: `self` refers to the _first_
      // child of the `root` trace
      return { isParentChild: traceNode.self === nextTrace, traceNode };
    } else {
      let previousIndex = i;
      previousIndex--;

      // Check with the previous trace that this is the child
      const { isParentChild, traceNode: returnedTraceNode } = checkTrace(traceNode, traceAddress, previousIndex);
      if(isParentChild) {
        // If this is the _first_ child...
        // (its relation to its parent
        // is a little different)
        if(i === 1) {
          const currentTrace = traceAddress[i].toString();

          let nextIndex = i;
          nextIndex++;
          const nextTrace = traceAddress[nextIndex].toString();

          // Add the child trace to this _first_ child
          returnedTraceNode.child = { parent: currentTrace, self: nextTrace };

          // If this is the last index in the `traceAddress`,
          // the first child trace is a reentrant instance 
          if(traceAddress.length === (i + 1)) {
            returnedTraceNode.traceInstance = true;
          }

          return { isParentChild: true, traceNode: returnedTraceNode };
        } else {

          return  { isParentChild: true, traceNode: returnedTraceNode };
        }
      };
    }
  }

  console.log(`traceTreePerAddress before: ${JSON.stringify(traceTreePerAddress)}`);

  txEvent.traces.forEach((trace: Trace) => {
    const traceRecipient = trace.action.to;
    const traceAddress = trace.traceAddress;

    // Add `traceRecipient` if we haven't
    // already began processing it.
    if(!Object.keys(traceTreePerAddress).includes(traceRecipient)) {
      traceTreePerAddress[traceRecipient] = { traceTree: {} };
    }

    /*
    { to: "0x4", traceAddress: [0, 1] }
    { to: "0x4", traceAddress: [0, 1, 0, 0, 0] }
    */

    // Go through the `traceAddress`
    // values, adding them to `traceTree`, if they
    // are not already there.
    traceAddress.forEach((currTrace: number, i: number) => {
      const currentTrace = currTrace.toString();

      // If we're at the first traceAddress AND
      // we haven't already added it, add it.
      if(i === 0 && !Object.keys(traceTreePerAddress[traceRecipient].traceTree).includes(currentTrace)) {
        // For legibility
        const rootTrace = currentTrace;

        // cast `i` to new variable to
        // not actually increase it when
        // using it to find `childTrace`
        // TODO: Add checks in place for
        // where the index could be the last
        // in the array
        let nextIndex = i;
        nextIndex++;
        const childTrace = traceAddress[nextIndex].toString();

        traceTreePerAddress[traceRecipient].traceTree[rootTrace]= { parent: rootTrace, self: childTrace };
      } else {
        // Check if the preceeding `traceAddress` indexes
        // have been added to a `traceRecipient` index,
        // working your way to the current. If they haven't,
        // add them.
        const rootTrace = traceAddress[0].toString();
        checkTrace(traceTreePerAddress[traceRecipient].traceTree[rootTrace], traceAddress, i);
      }

    });
  });

  console.log(`traceTreePerAddress after: ${JSON.stringify(traceTreePerAddress)}`);

  // After populating the tree, traverse the tree,
  // by each address-as-key and create findings
  // where necessary.
  //
  // Key is to find the longest path of "hits"
  // (actual trace instances) for a given address,
  // and use that `traceAddress` entry as the one
  // to use in the finding, and the amount of them
  // as the amount of reentrant calls.

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
