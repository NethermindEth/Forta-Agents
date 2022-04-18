import {
  Log,
  TransactionEvent,
  Trace,
  HandleTransaction,
  Finding,
  FindingType,
  FindingSeverity,
} from "forta-agent";
import Web3 from "web3";
import AddressesFetcher from "./addresses.fetcher";

const PEEK_FUNCTION_SELECTOR = "0x59e02dd7";
const LOG_VALUE_EVENT_SIGNATURE = "LogValue(bytes32)";

export const createFinding = (
  contractAddress: string,
  currentPrice: bigint,
  queuedPrice: bigint
): Finding => {
  return Finding.fromObject({
    name: "MakerDAO OSM Contract Big Enqueued Price Deviation",
    description:
      "The new enqueued price deviate more than 6% from current price",
    alertId: "MakerDAO-OSM-1",
    type: FindingType.Suspicious,
    severity: FindingSeverity.Info,
    everestId: "0xbabb5eed78212ab2db6705e6dfd53e7e5eaca437",
    metadata: {
      contractAddress: contractAddress,
      currentPrice: currentPrice.toString(),
      queuedPrice: queuedPrice.toString(),
    },
  });
};

const correctFunctionCalled = (trace: Trace): boolean => {
  return trace.action.input === PEEK_FUNCTION_SELECTOR;
};

const callWasSuccessful = (trace: Trace): boolean => {
  const results = new Web3().eth.abi.decodeParameters(
    ["bytes32", "bool"],
    //@ts-ignore
    trace.result.output
  );
  return results[1];
};

const decodeNextValue = (trace: Trace): bigint => {
  const results = new Web3().eth.abi.decodeParameters(
    ["uint128", "bool"],
    //@ts-ignore
    trace.result.output
  );
  return BigInt(results[0]);
};

const getNextValuesForOSM = (contractAddress: string, traces: Trace[]) =>
  traces.filter((trace) =>
    trace.action.from === contractAddress &&
    correctFunctionCalled(trace) &&
    callWasSuccessful(trace)
  ).map(decodeNextValue);


const decodeCurrentValue = (log: Log): bigint =>
  BigInt(new Web3().eth.abi.decodeParameter("uint128", log.data) as any);

const getCurrentValues = (
  contractAddress: string,
  txEvent: TransactionEvent
) => {
  return txEvent
    .filterEvent(LOG_VALUE_EVENT_SIGNATURE, contractAddress)
    .map(decodeCurrentValue);
};

const abs = (a: bigint): bigint => a < 0 ? -a : a;

const needToReport = (currentValue: bigint, nextValue: bigint): boolean => {
  const bigDeviation: bigint = (BigInt(6) * currentValue) / BigInt(100);
  return abs(currentValue - nextValue) > bigDeviation;
};

const checkOSMContract = (
  contractAddress: string,
  txEvent: TransactionEvent
): Finding | null => {
  const currentValues: bigint[] = getCurrentValues(contractAddress, txEvent);
  const nextValues: bigint[] = getNextValuesForOSM(
    contractAddress,
    txEvent.traces
  );

  const lessLenght: number = Math.min(currentValues.length, nextValues.length);
  for (let i = 0; i < lessLenght; i++) {
    if (needToReport(currentValues[i], nextValues[i])) {
      return createFinding(
        contractAddress.toLowerCase(),
        currentValues[i],
        nextValues[i]
      );
    }
  }

  return null;
};

export default function provideBigQueuedPriceDeviationHandler(
  fetcher: AddressesFetcher,
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const contractAddressesList: string[] = await fetcher.get(txEvent.timestamp);
    for (let i = 0; i < contractAddressesList.length; i++) {
      const finding: Finding | null = checkOSMContract(
        contractAddressesList[i],
        txEvent
      );
      if (finding !== null) {
        findings.push(finding);
      }
    }
    return findings;
  };
};
