import { 
  TransactionEvent, 
  LogDescription,
  getEthersProvider,
} from 'forta-agent';
import abi from './abi';
import DataFetcher from './data.fetcher';
import findings from './findings';

const CURVE_PROVIDER: string = "0x0000000022D53366457F9d5E68Ec105046FC4383";

const provideHandleTransaction = (fetcher: DataFetcher) =>
  async (txEvent: TransactionEvent) => {
    const logs: LogDescription[] = txEvent.filterLog(abi.POOL_EVENTS);

    const isPoolPromises: Promise<boolean>[] = logs.map(
      (log: LogDescription) => fetcher.isPool(log.address),
    );
    const isPool: boolean[] = await Promise.all(isPoolPromises);
    
    return logs
      .filter((_: LogDescription, idx: number) => isPool[idx])
      .map(findings.createFinding)
  }

export default {
  handleTransaction: provideHandleTransaction(
    new DataFetcher(
      CURVE_PROVIDER,
      getEthersProvider(),
    ),
  ),
  provideHandleTransaction,
};
