import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType
} from 'forta-agent'
import keccak256 from 'keccak256'

// any upgrade topic event can be passed through
export const UPGRADE_EVENT_SIGNATURE = 'id(Upgraded(address))'

export const generateHash = (signature: string): string => {
  const hash = keccak256(signature).toString('hex')
  return '0x' + hash
}

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = []

  const upgradeEvents = txEvent.filterEvent(UPGRADE_EVENT_SIGNATURE)
  const proxyAddress = txEvent.to as string

  if (!upgradeEvents.length) return findings

  findings.push(
    Finding.fromObject({
      name: 'Upgrade Event',
      description: `Upgrade Event is detected`,
      alertId: 'NETHFORTA-6',
      type: FindingType.Suspicious,
      severity: FindingSeverity.High,
      metadata: {
        proxy: proxyAddress
      }
    })
  )

  return findings
}

export default {
  handleTransaction
}
