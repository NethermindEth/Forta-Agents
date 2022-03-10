import { Finding, HandleTransaction, TransactionEvent, LogDescription, getEthersProvider } from 'forta-agent';
import utils, { createFinding, AMP_CONTRACT, FLEXA_MANAGER_CONTRACT } from './utils';
import Fetcher from './fetcher';
import { BigNumber } from 'ethers';

const THRESHOLD: BigNumber = BigNumber.from("1000000000000000000000000");

export const provideHandleTransaction = (
  fetcher: Fetcher,
  threshold: BigNumber,
): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const block: number = txEvent.blockNumber;    
    const findings: Finding[] = [];

    const logs: LogDescription[] = (txEvent.filterLog(utils.AMP_ABI, fetcher.amp));
    const isFlexaPartition: boolean[] = await Promise.all(
      logs.map(log => fetcher.isPartition(block, log.args["fromPartition"]))
    );   
     
    logs.forEach((log, i) => {
      const from: string = log.args["from"];
      if (from.toLowerCase() === fetcher.flexa && isFlexaPartition[i] && BigNumber.from(log.args["value"]).gt(threshold)) {
        findings.push(createFinding(log));
      }
    })
    return findings;    
  }  

export default {
  handleTransaction: provideHandleTransaction(new Fetcher(AMP_CONTRACT, FLEXA_MANAGER_CONTRACT, getEthersProvider()), THRESHOLD),
};
