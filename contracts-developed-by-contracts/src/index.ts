import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType, 
  getJsonRpcUrl
} from 'forta-agent';
import { Trace } from 'forta-agent/dist/sdk/trace';
import Web3 from 'web3';

const provideHandleTransaction = (web3: any): HandleTransaction => {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    for(let i = 0; i < txEvent.traces.length; ++i){
      const trace: Trace = txEvent.traces[i];
      if(trace.type === 'create'){
        const from: string = trace.action.from;

        const code: string = await web3.eth.getCode(from);
        if(code !== '0x'){
          const addr: string = trace.result.address;
          findings.push(
            Finding.fromObject({
              name: "Contract developed by a contract",
              description: `Contract (${from}) develop the new contract (${addr})`,
              alertId: "NETHFORTA-07",
              type: FindingType.Suspicious,
              severity: FindingSeverity.High,
            })
          )
        }
      }
    };

    return findings;
  }
};

export default {
  handleTransaction: provideHandleTransaction(new Web3(getJsonRpcUrl())),
};
