import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
} from 'forta-agent';
import { 
  provideETHTransferHandler, 
  provideEventCheckerHandler,
} from 'forta-agent-tools';
import utils from './utils';
import { toWei } from 'web3-utils';

const MULTISIGS: string[] = [
  "0x9d074E37d408542FD38be78848e8814AFB38db17",
  "0x066419EaEf5DE53cc5da0d8702b990c5bc7D1AB3",
];
const TRANSFER_THRESHOLD = toWei("10");

export const provideHandleTransaction = (
  addresses: string[], 
  threshold: string
): HandleTransaction => {
  return async (txEvent: TransactionEvent) => {
    const handlers: HandleTransaction[] = addresses.map(
      (addr: string) => [
        provideEventCheckerHandler(
          utils.provideOwnerAddedFindingGenerator(addr), 
          utils.ADDED_OWNER,
          addr,
        ),
        provideEventCheckerHandler(
          utils.provideOwnerRemovedFindingGenerator(addr), 
          utils.REMOVED_OWNER,
          addr,
        ),
        provideEventCheckerHandler(
          utils.provideExecutionSuccessFindingGenerator(addr), 
          utils.EXECUTION_SUCCESS,
          addr,
        ),
        provideEventCheckerHandler(
          utils.provideExecutionFailureFindingGenerator(addr), 
          utils.EXECUTION_FAILURE,
          addr,
        ),
        provideEventCheckerHandler(
          utils.provideERC20TransferFindingGenerator(addr), 
          utils.TRANSFER,
          undefined,
          utils.provideERC20filter(addr),
        ),
        provideETHTransferHandler(
          utils.provideETHTransferFindingGenerator(addr), 
          { from: addr.toLowerCase(), valueThreshold: threshold },
        ),
      ] 
    ).flat();

    const findings: Finding[][] = await Promise.all(handlers.map(handler => handler(txEvent)));
  
    return findings.flat();
  };
};

export default {
  handleTransaction: provideHandleTransaction(
    MULTISIGS, 
    TRANSFER_THRESHOLD,
  ),
};
