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

export const createFinding = (from: string, addr: string): Finding => 
  Finding.fromObject({
    name: "Contract deployed by a contract",
    description: `Contract (${from}) deployed the new contract (${addr})`,
    alertId: "NETHFORTA-9",
    type: FindingType.Suspicious,
    severity: FindingSeverity.Info,
    metadata:{
      deployer: from,
      contract: addr,
    }
  });

const provideHandleTransaction = (getCode: any): HandleTransaction => {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    for(let i = 0; i < txEvent.traces.length; ++i){
      const trace: Trace = txEvent.traces[i];
      if(trace.type === 'create'){
        const from: string = trace.action.from;

        // Check is the contract creator is a contract
        const code: string = await getCode(from);
        if(code !== '0x'){
          const addr: string = trace.result.address;
          findings.push(createFinding(from, addr));
        }
      }
    };

    return findings;
  }
};

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(new Web3(getJsonRpcUrl()).eth.getCode),
};
