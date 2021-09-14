import { Finding, HandleTransaction, TransactionEvent, Trace } from "forta-agent";
import { FindingGenerator } from "./utils";
import Web3 from "web3";

const abi = new Web3().eth.abi;

interface AgentOptions {
  from?: string;
  to?: string;
}

interface TraceInfo {
  from: string;
  to: string;
  input: string;
}

type Filter = (traceInfo: TraceInfo) => boolean;

const fromTraceActionToTraceInfo = (trace: Trace): TraceInfo => {
  return {
    to: trace.action.to,
    from: trace.action.from,
    input: trace.action.input,
  };
};

const createFilter = (functionSignature: string, options: AgentOptions | undefined): Filter => {
  if (options === undefined) {
    return (_) => true;
  }

  return (traceInfo) => {
    if (options.from !== undefined && options.from !== traceInfo.from) return false;

    if (options.to !== undefined && options.to !== traceInfo.to) return false;

    const expectedSelector: string = abi.encodeFunctionSignature(functionSignature);
    const functionSelector: string = traceInfo.input.slice(0, 10);
    if (expectedSelector !== functionSelector) return false;

    return true;
  };
};

export default function provideFunctionCallsDetectorAgent(
  findingGenerator: FindingGenerator,
  functionSignature: string,
  agentOptions?: AgentOptions
): HandleTransaction {
  const filterTransferInfo: Filter = createFilter(functionSignature, agentOptions);
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    return txEvent.traces
      .map(fromTraceActionToTraceInfo)
      .filter(filterTransferInfo)
      .map((traceInfo) => findingGenerator(traceInfo));
  };
}
