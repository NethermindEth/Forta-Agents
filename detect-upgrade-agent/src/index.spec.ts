import {
  TransactionEvent,
  FindingType,
  FindingSeverity,
  Finding,
  EventType,
  Network,
  HandleTransaction
} from 'forta-agent'

import agent, { generateHash, UPGRADE_EVENT_SIGNATURE } from '.'

describe('Detect Upgrade Events', () => {
  let handleTransaction: HandleTransaction

  const createTxEvent = ({ logs }: any): TransactionEvent => {
    const tx: any = {}
    const receipt: any = { logs }
    const block: any = {}
    const addresses: any = {}

    return new TransactionEvent(
      EventType.BLOCK,
      Network.MAINNET,
      tx,
      receipt,
      [],
      addresses,
      block
    )
  }

  beforeAll(() => {
    handleTransaction = agent.handleTransaction
  })

  describe('handleTransaction', () => {
    it('should return empty finding', async () => {
      const upgradeEvent = {
        topics: []
      }

      const txEvent = createTxEvent({
        logs: [upgradeEvent]
      })

      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])
    })
    it('returns a finding when upgrade event detected', async () => {
      const upgradeEventTopic: string = generateHash(UPGRADE_EVENT_SIGNATURE)

      const upgradeEvent = {
        topics: [upgradeEventTopic]
      }

      const txEvent = createTxEvent({
        logs: [upgradeEvent]
      })

      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: 'Upgrade Event',
          description: `Upgrade Event is detected`,
          alertId: 'FORTA-6',
          type: FindingType.Suspicious,
          severity: FindingSeverity.High
        })
      ])
    })
  })
})
