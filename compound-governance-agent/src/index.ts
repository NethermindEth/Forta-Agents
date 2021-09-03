import BigNumber from 'bignumber.js'
import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from 'forta-agent'
import { COMPOUND_GOVERNANCE_ADDRESS, Sigs } from './utils'

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = []

  for (let sig in Sigs) {
    const logs = txEvent.filterEvent(Sigs[sig], COMPOUND_GOVERNANCE_ADDRESS)

    if (!logs.length) continue

    if (!txEvent.status) {
      findings.push(
        Finding.fromObject({
          name: 'COMPOUND GOVERNANCE EVENT',
          description: `Compound Failed ${sig} Proposal event is detected.`,
          alertId: 'NETHFORTA-13',
          protocol: 'Compound',
          type: FindingType.Suspicious,
          severity: FindingSeverity.High,
        })
      )
    } else {
      findings.push(
        Finding.fromObject({
          name: 'COMPOUND GOVERNANCE EVENT',
          description: `Compound ${sig} Proposal Event is detected.`,
          alertId: 'NETHFORTA-13',
          protocol: 'Compound',
          type: FindingType.Unknown,
          severity: FindingSeverity.Info,
        })
      )
    }
  }

  return findings
}

export default {
  handleTransaction,
}
