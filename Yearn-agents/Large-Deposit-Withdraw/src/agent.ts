import { 
  BlockEvent, 
  Finding, 
  HandleBlock, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType 
} from 'forta-agent';
import deposit from './deposit';
import withdraw from './withdraw';
import VaultFetcher from './fetcher';

const PRECENT: number = 40 // % that define what large means
const YEARN_PROVIDER: string = '0x437758d475f70249e03eda6be23684ad1fc375f0';

const provideHandleTransaction = (
  provider: string, 
  percent: number, 
  fetcher: VaultFetcher,
  web3: any,
): HandleTransaction => 
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    return findings;
  };



export default {
  
};
