import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  Trace,
} from "forta-agent";
import { FindingGenerator } from "./utils";
import Web3 from "web3";

const web3 = new Web3();

interface AgentOptions{
  from?: string;
  to?: string;
  functionSignature: string;
};

interface TraceInfo{
  from: string;
  to: string;
  input: string;
};

interface Filter{
  (traceInfo: TraceInfo): boolean,
};

const fromTraceActionToTraceInfo = (trace: Trace): TraceInfo => {
  return {
    to: trace.action.to,
    from: trace.action.from,
    input: trace.action.input,
  };
};

const createFilter = (options: AgentOptions | undefined): Filter => {
  if (options === undefined) {
    return (_) => true;
  }

  return (traceInfo) => {
    if (options.from !== undefined && options.from !== traceInfo.from) {
      return false;
    }

    if (options.to !== undefined && options.to !== traceInfo.to) {
      return false;
    }

    if (options.functionSignature !== undefined) {
      const expectedSelector: string = web3.eth.abi.encodeFunctionSignature(options.functionSignature);
      const functionSelector: string = traceInfo.input.slice(0, 10);
      if(expectedSelector !== functionSelector)
        return false;
    }

    return true;
  };
};

export default function provideFunctionCallsDetectorAgent(
  findingGenerator: FindingGenerator,
  agentOptions?: AgentOptions
): HandleTransaction {
  const filterTransferInfo: Filter = createFilter(agentOptions);
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    return txEvent.traces
      .map(fromTraceActionToTraceInfo)
      .filter(filterTransferInfo)
      .map((traceInfo) => findingGenerator(traceInfo));
  };
}
