import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  getJsonRpcUrl,
} from 'forta-agent';
import { provideETHTransferHandler, provideEventCheckerHandler } from 'forta-agent-tools';
import Web3 from "web3";
import utils from './utils';


const _ensReolver: any = new Web3(getJsonRpcUrl()).eth.ens.getAddress;


export const MULTISIGS: string[] = [
  "ychad.eth",
  "brain.ychad.eth",
  "dev.ychad.eth",
  "mechanics.ychad.eth",
];


const provideHandleTransaction = (ensResolver: any): HandleTransaction => {
  return async (txEvent: TransactionEvent) => {
    const addresses: string[] = await Promise.all(MULTISIGS.map((ens: string) => ensResolver(ens)));
    const handlers: HandleTransaction[] = addresses.map(
      (addr: string, i: number) => [
        provideEventCheckerHandler(
          utils.provideOwnerAddedFindingGenerator(MULTISIGS[i]), 
          "AddedOwner(address)",
          addr,
        ),
        provideEventCheckerHandler(
          utils.provideOwnerRemovedFindingGenerator(MULTISIGS[i]), 
          "RemovedOwner(address)",
          addr,
        ),
        provideEventCheckerHandler(
          utils.provideExecutionSuccessFindingGenerator(MULTISIGS[i]), 
          "ExecutionSuccess(bytes32,uint256)",
          addr,
        ),
        provideEventCheckerHandler(
          utils.provideExecutionFailureFindingGenerator(MULTISIGS[i]), 
          "ExecutionFailure(bytes32,uint256)",
          addr,
        ),
        provideEventCheckerHandler(
          utils.provideERC20TransferFindingGenerator(MULTISIGS[i]), 
          "Transfer(address,address,uint256)",
          undefined,
          utils.provideERC20filter(addr),
        ),
        provideETHTransferHandler(
          utils.provideETHTransferFindingGenerator(MULTISIGS[i]), 
          { from: addr },
        ),
      ] 
    ).flat();

    const findings: Finding[][] = await Promise.all(handlers.map(handler => handler(txEvent)));
  
    return findings.flat();
  };
};


export default {
  handleTransaction: provideHandleTransaction(_ensReolver),
};
