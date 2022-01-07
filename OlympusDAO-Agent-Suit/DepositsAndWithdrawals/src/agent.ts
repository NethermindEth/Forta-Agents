import { 
  HandleTransaction, 
  TransactionEvent, 
  LogDescription
} from 'forta-agent';
import utils from './utils';
import { BigNumber } from 'ethers';

const TREASURY_CONTRACT: string = "0x31F8Cc382c9898b273eff4e0b7626a6987C846E8";
const THRESHOLD: BigNumber = BigNumber.from("1000000");

export const provideHandleTransaction = (
  treasury: string,
  threshold: BigNumber,
): HandleTransaction =>
  async (txEvent: TransactionEvent) => txEvent
    .filterLog(utils.TREASURY_ABI, treasury)
    .filter((log: LogDescription) => log.args["value"].gte(threshold))
    .map(utils.createFinding);

export default {
  handleTransaction: provideHandleTransaction(TREASURY_CONTRACT, THRESHOLD),
};
