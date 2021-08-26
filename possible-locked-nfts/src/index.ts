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

const INTERESTING_PROTOCOLS: string[] = [
  "0x5d00d312e171be5342067c09bae883f9bcb2003b", // Etheremon Monster Token
  "0x0e3a2a1f2146d86a604adc220b4967a898d7fe07", // Gods Unchained Cards
  "0x343f999eaacdfa1f201fb8e43ebb35c99d9ae0c1", // Lonely Aliens Space Club
  "0xf621b26ce64ed28f42231bcb578a8089f7958372", // Bored Mummy Waking Up
  "0xbe6e3669464e7db1e1528212f0bff5039461cb82", // Wicked Ape Bone Club
  "0x7c40c393dc0f283f318791d746d894ddd3693572", // Wrapped MoonCatsRescue
  "0x3bf2922f4520a8BA0c2eFC3D2a1539678DaD5e9D", // 0n1 Force
  "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d", // Bored Ape Yacht Club
  "0xf3ae416615A4B7c0920CA32c2DfebF73d9D61514", // ChiptoPunks
  "0xaaDc2D4261199ce24A4B0a57370c4FCf43BB60aa", // TheCurrency
];

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
