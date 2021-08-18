import BigNumber from 'bignumber.js'
import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from 'forta-agent'
import { COMPOUND_GOVERNANCE_ADDRESS, HashedSigs } from './utils'

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = []

  txEvent.receipt.logs.forEach((log) => {
    if (!log.address || log.address != COMPOUND_GOVERNANCE_ADDRESS)
      return findings

    HashedSigs.forEach((event: any) => {
      const topic = Object.keys(event).filter((key) => {
        return log.topics.includes(event[key])
      })

      if (!topic.length) return findings

      if (!txEvent.status) {
        findings.push(
          Finding.fromObject({
            name: 'COMPOUND GOVERNANCE EVENT',
            description: `Compound Failed ${topic[0]} Proposal event is detected.`,
            alertId: 'NETHFORTA-8',
            protocol: 'Compound',
            type: FindingType.Suspicious,
            severity: FindingSeverity.High,
          })
        )
      } else {
        findings.push(
          Finding.fromObject({
            name: 'COMPOUND GOVERNANCE EVENT',
            description: `Compound ${topic[0]} Proposal Event is detected.`,
            alertId: 'NETHFORTA-8',
            protocol: 'Compound',
            type: FindingType.Unknown,
            severity: FindingSeverity.Info,
          })
        )
      }
    })
  })

  return findings
}

export default {
  handleTransaction,
}
