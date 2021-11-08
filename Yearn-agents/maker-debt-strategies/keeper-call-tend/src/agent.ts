import {  
  Finding, 
  TransactionEvent, 
  getJsonRpcUrl,
  FindingSeverity,
  FindingType
} from 'forta-agent'
import Web3 from 'web3'
import MakerFetcher from "./maker.fetcher"
import {FindingGenerator, provideFunctionCallsDetectorHandler} from 'forta-agent-tools'
import {tendABI} from "./abi"

const web3: Web3 = new Web3(getJsonRpcUrl())
const fetcher: MakerFetcher = new MakerFetcher(web3)

const createFindingTendCall: FindingGenerator = (metadata?: ({[key: string]: any}) | undefined) => {
  return Finding.fromObject({
    name: "MAKER - Keeper called tend",
    description: "A Maker strategy is called by its keeper",
    severity: FindingSeverity.Info, 
    type: FindingType.Info, 
    alertId: "Yearn-2-2",
    protocol: "Yearn", 
    metadata: {
      strategy: metadata?.to
    }
  })
}

export const provideHandleTransaction = ( fetcher: MakerFetcher) => {
  return async (txEvent: TransactionEvent) => {
    let findings: Finding[] = [];

    if (!txEvent.status) return findings;

    const makersWithKeepers = await fetcher.getActiveMakers(txEvent.blockNumber);
    
    if (makersWithKeepers)
      for (let maker_keeper of makersWithKeepers)
      {
        findings = findings.concat(
          await provideFunctionCallsDetectorHandler(
            createFindingTendCall,
            tendABI,
            {
              from: maker_keeper[1],
              to: maker_keeper[0]
            }
          )(txEvent)
        )
      } 
    
    return findings;
  }
}

export default {
  handleTransaction: provideHandleTransaction(fetcher),
  provideHandleTransaction
}