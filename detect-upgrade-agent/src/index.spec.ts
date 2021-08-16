import {
  TransactionEvent,
  FindingType,
  FindingSeverity,
  Finding,
  EventType,
  Network,
  HandleTransaction
} from 'forta-agent'

import agent from '.'

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
    it('returns a finding when upgrade event detected', async () => {
      const upgradeEventTopic =
        'bc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b'

      const upgradeEvent = {
        topics: [upgradeEventTopic]
      }

      const txEvent = createTxEvent({
        logs: [upgradeEvent]
      })

      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual(
        Finding.fromObject({
          name: 'Upgrade Event',
          description: `Upgrade Event is detected`,
          alertId: 'FORTA-6',
          type: FindingType.Suspicious,
          severity: FindingSeverity.High
        })
      )
    })
  })
})
