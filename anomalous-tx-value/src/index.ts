import BigNumber from 'bignumber.js'
import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType
} from 'forta-agent'

export const DECIMALS = 10 ** 18
export const TX_VALUE_THRESHHOLD = 10 * DECIMALS

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = []

  // create finding if gas used is higher than threshold
  const value = new BigNumber(txEvent.transaction.value)
  if (value.isGreaterThan(TX_VALUE_THRESHHOLD)) {
    findings.push(
      Finding.fromObject({
        name: 'High Values Transaction Detected',
        description: `Value is: ${value}`,
        alertId: 'FORTA-1',
        severity: FindingSeverity.High,
        type: FindingType.Suspicious
      })
    )
  }

  return findings
}

export default {
  handleTransaction
}
