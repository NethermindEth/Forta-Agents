import BigNumber from 'bignumber.js';
import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType,
  getJsonRpcUrl,
} from 'forta-agent';
import { provideEventCheckerHandler } from 'forta-agent-tools';
import Web3 from "web3";


const _ensReolver: any = new Web3(getJsonRpcUrl()).eth.ens.getAddress;


export const MULTISIGS: string[] = [
  "ychad.eth",
  "brain.ychad.eth",
  "dev.ychad.eth",
  "mechanics.ychad.eth",
];


const provideHandleTransaction = (ensResolver: any): HandleTransaction => {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
  
    return findings;
  };
};


export default {
  handleTransaction: provideHandleTransaction(_ensReolver),
};
