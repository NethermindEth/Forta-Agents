import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  getJsonRpcUrl,
} from 'forta-agent';
import { provideETHTransferHandler, provideEventCheckerHandler } from 'forta-agent-tools';
import Web3 from "web3";
import utils from './utils';


const _web3: any = new Web3(getJsonRpcUrl());


export const MULTISIGS: string[] = [
  "ychad.eth",
  "brain.ychad.eth",
  "dev.ychad.eth",
  "mechanics.ychad.eth",
];


export const provideHandleTransaction = (web3: Web3): HandleTransaction => {
  const fetcher = utils.createFetcher(web3);

  return async (txEvent: TransactionEvent) => {
    const block: number = txEvent.blockNumber;
    const addresses: string[] = await Promise.all(MULTISIGS.map((ens: string) => fetcher(block, ens)));

    const handlers: HandleTransaction[] = addresses.map(
      (addr: string, i: number) => [
        provideEventCheckerHandler(
          utils.provideOwnerAddedFindingGenerator(MULTISIGS[i]), 
          utils.ADDED_OWNER,
          addr,
        ),
        provideEventCheckerHandler(
          utils.provideOwnerRemovedFindingGenerator(MULTISIGS[i]), 
          utils.REMOVED_OWNER,
          addr,
        ),
        provideEventCheckerHandler(
          utils.provideExecutionSuccessFindingGenerator(MULTISIGS[i]), 
          utils.EXECUTION_SUCCESS,
          addr,
        ),
        provideEventCheckerHandler(
          utils.provideExecutionFailureFindingGenerator(MULTISIGS[i]), 
          utils.EXECUTION_FAILURE,
          addr,
        ),
        provideEventCheckerHandler(
          utils.provideERC20TransferFindingGenerator(MULTISIGS[i]), 
          utils.TRANSFER,
          undefined,
          utils.provideERC20filter(addr),
        ),
        provideETHTransferHandler(
          utils.provideETHTransferFindingGenerator(MULTISIGS[i]), 
          { from: addr.toLowerCase(), valueThreshold: "1" },
        ),
      ] 
    ).flat();

    const findings: Finding[][] = await Promise.all(handlers.map(handler => handler(txEvent)));
  
    return findings.flat();
  };
};


export default {
  handleTransaction: provideHandleTransaction(_web3),
};
