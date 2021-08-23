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


const BLACKLISTED_ADDRESSES: string[] = [];


const provideHandleTransaction = (blacklistedAddresses : string[]): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
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
  };
}

export default {
  handleTransaction: provideHandleTransaction(BLACKLISTED_ADDRESSES),
}