import BigNumber from 'bignumber.js'
import { 
  BlockEvent, 
  Finding, 
  HandleBlock, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType 
} from 'forta-agent'

const web3: Web3 = new Web3(getJsonRpcUrl());

export const createFinding = (strategyToReport: string): Finding => {
  return Finding.fromObject({
    name: "Yearn Finance no harvested strategies",
    alertId: "NETHFORTA-22",
    description: "A yearn finance strategy have been too much time without trigerring harvest",
    severity: FindingSeverity.Info,
    type: FindingType.Suspicious,
    metadata: {
      Strategy: strategyToReport
    }
  })
}

const handleBlock: HandleBlock = async (blockEvent: BlockEvent) => {
  const findings: Finding[] = []

  // create finding if gas used is higher than threshold
  const gasUsed = new BigNumber(txEvent.gasUsed)
  if (gasUsed.isGreaterThan("1000000")) {
    findings.push(Finding.fromObject({
      name: "High Gas Used",
      description: `Gas Used: ${gasUsed}`,
      alertId: "FORTA-1",
      severity: FindingSeverity.Medium,
      type: FindingType.Suspicious
    }))
  }

  return findings
}

// const handleBlock: HandleBlock = async (blockEvent: BlockEvent) => {
//   const findings: Finding[] = [];
//   // detect some block condition
//   return findings;
// }

export default {
  handleTransaction,
  // handleBlock
}