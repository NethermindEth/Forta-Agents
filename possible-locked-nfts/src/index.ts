import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType,
  Trace,
  TraceAction,
  getJsonRpcUrl,
} from 'forta-agent';
import { addHexPrefix } from "ethereumjs-util";
import Web3 from 'web3';

const web3 = new Web3(getJsonRpcUrl());
const abi = web3.eth.abi;

const SIGNATURE: string = 'transferFrom(address,address,uint256)';
export const SIGHASH: string = abi.encodeFunctionSignature(SIGNATURE);

const INTERESTING_PROTOCOLS: string[] = [];

const decodeInput = (input: string): any => 
  abi.decodeParameters([
      {type:'address', name:'from'}, 
      {type:'address', name:'to'}, 
      {type:'uint256', name:'tokenId'},
    ], 
    addHexPrefix(input.slice(10)),
  );

export const createFinding = (
  protocol:string, 
  to:string, 
  tokenId:number
): Finding =>
  Finding.fromObject({
    name: "Insecure transferFrom call",
    description: `transferFrom execution detected in Contract (${protocol})`,
    alertId: "NETHFORTA-17",
    type: FindingType.Suspicious,
    severity: FindingSeverity.Info,
    metadata: {
      receiver: to,
      tokenId: tokenId.toString(),
    },
  });

const provideHandleTransaction = (getCode: any, protocols: string[]): HandleTransaction => {

  const targetProtocol: {[key: string]: boolean} = {};
  protocols.forEach((proto:string) => targetProtocol[proto] = true);

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const traces: Trace[] = txEvent.traces;
    for(let i: number = 0; i < traces.length; i++){
      const action: TraceAction = traces[i].action;

      // check if the trace is not interacting with an interesting protocol
      if(!targetProtocol[action.to]) continue;

      // check if it is not a transferFrom call
      if(action.input.slice(0, 10) !== SIGHASH) continue;

      // Check if the `to` parameter is a contract
      const input: any = decodeInput(action.input);
      const code: string = await getCode(input.to.toLowerCase());
      if(code !== "0x"){
        findings.push(
          createFinding(
            action.to.toLowerCase(),
            input.to.toLowerCase(),
            input.tokenId,
          ),
        );
      }
    }

    return findings;
  };
};

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(
    web3.eth.getCode,
    INTERESTING_PROTOCOLS,
  ),
};
