import { 
  HandleTransaction, 
  TransactionEvent, 
} from 'forta-agent';
import utils from './utils';

const TREASURY_CONTRACT: string = "0x31F8Cc382c9898b273eff4e0b7626a6987C846E8";

export const provideHandleTransaction = (treasury: string): HandleTransaction =>
  async (txEvent: TransactionEvent) => txEvent
    .filterLog(utils.TREASURY_ABI, treasury)
    .map(utils.createFinding);

export default {
  handleTransaction: provideHandleTransaction(TREASURY_CONTRACT),
};
