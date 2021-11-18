import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  getJsonRpcUrl,
} from 'forta-agent';
import deposit from './deposit';
import withdraw from './withdraw';
import DataFetcher from './fetcher';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';

const PERCENT: number = 40 // % that define what large means
const YEARN_PROVIDER: string = '0x437758d475f70249e03eda6be23684ad1fc375f0';  

export const provideHandleTransaction = (
  provider: string, 
  percent: number, 
  fetcher: DataFetcher,
): HandleTransaction => 
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const vaults: string[] = await fetcher.getVaults(provider, txEvent.blockNumber);

    const limits: BigNumber[] = await Promise.all([
      ...vaults.map((v: string) => fetcher.getMaxDeposit(v, txEvent.blockNumber - 1)),
      ...vaults.map((v: string) => fetcher.getMaxWithdraw(v, txEvent.blockNumber - 1)),
    ]);
    const depositLimit: BigNumber[] = limits.slice(0, vaults.length);
    const withdrawLimit: BigNumber[] = limits.slice(vaults.length);

    const handlers: HandleTransaction[] = [];
    for(let i = 0; i < vaults.length; ++i){
      handlers.push(deposit.provideLargeDepositDetector(
        vaults[i], 
        depositLimit[i].multipliedBy(percent).div(100),
      ));
    }
    for(let i = 0; i < vaults.length; ++i){
      handlers.push(withdraw.provideLargeWithdrawDetector(
        vaults[i], 
        withdrawLimit[i].multipliedBy(percent).div(100),
      ));
    }

    return Promise
      .all(handlers.map((h: HandleTransaction) => h(txEvent)))
      .then((data: Finding[][]) => data.flat());
  };


export default {
  handleTransaction: provideHandleTransaction(
    YEARN_PROVIDER, 
    PERCENT, 
    new DataFetcher(new Web3(getJsonRpcUrl())),
  ),
};
