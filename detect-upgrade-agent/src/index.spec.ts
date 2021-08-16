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

  const createTxEvent = ({
    addresses,
    blockNumber,
    logs
  }: any): TransactionEvent => {
    const tx: any = {}
    const receipt: any = { logs }
    const block: any = {}
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
        '68171bf51270e22535ae8384944e038f162d9b34da9ee0f4d64d086e76515811'

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
