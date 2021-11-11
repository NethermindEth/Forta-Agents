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
    name: "MAKER Strategy - Keeper called tend",
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

    const activeMakersInfo = await fetcher.getActiveMakersInfo(txEvent.blockNumber);
    
    if (activeMakersInfo)
    {
      for (let maker of activeMakersInfo)
      {        
        if (!maker.checkedRatio) {
          if (maker.currentMakerVaultRatio.comparedTo(maker.collateralizationRatio.minus(maker.rebalanceTolerance)) < 0){
            findings.push(
              Finding.fromObject({
                name: "MAKER Strategy - MakerVaultRatio is less than acceptable ratio",
                description: "strategy.getCurrentMakerVaultRatio() < strategy.collateralizationRatio() - strategy.rebalanceTolerance()",
                severity: FindingSeverity.Medium, 
                type: FindingType.Info, 
                alertId: "Yearn-2-1",
                protocol: "Yearn", 
                metadata: {
                  strategy: maker.address
                }
              })
            )
          }
          maker.checkedRatio = true
        }

        findings = findings.concat(
          await provideFunctionCallsDetectorHandler(
            createFindingTendCall,
            tendABI,
            {
              from: maker.keeper,
              to: maker.address
            }
          )(txEvent)
        )
      }      
    }
    return findings;
  }
}

export default {
  handleTransaction: provideHandleTransaction(fetcher),
  provideHandleTransaction
}