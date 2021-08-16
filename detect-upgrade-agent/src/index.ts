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

const UPGRADE_EVENT_SIGNATURE = 'Upgraded(address)'

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = []

  const upgradeEvents = txEvent.filterEvent(UPGRADE_EVENT_SIGNATURE)
  console.log(txEvent)
  if (!upgradeEvents.length) return findings

  findings.push(
    Finding.fromObject({
      name: 'Upgrade Event',
      description: `Upgrade Event is detected`,
      alertId: 'FORTA-6',
      type: FindingType.Suspicious,
      severity: FindingSeverity.High
    })
  )

  return findings
}

export default {
  handleTransaction
}
