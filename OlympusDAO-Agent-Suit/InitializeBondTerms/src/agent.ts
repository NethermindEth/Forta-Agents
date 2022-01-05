import { 
  HandleTransaction, 
  TransactionEvent, 
} from 'forta-agent';
import utils from './utils';
import { utils as ethers } from "ethers";

const provideHandleTransaction = (bonds: string[]): HandleTransaction => 
  async (txEvent: TransactionEvent) => bonds
    .map((address: string) => txEvent
      .filterFunction(utils.BONDS_ABI, address)
      .map((desc: ethers.TransactionDescription) => 
        utils.createFinding(desc, address)
      )
    ).flat()

export default {
  handleTransaction: provideHandleTransaction(utils.BONDS_CONTRACTS),
};
