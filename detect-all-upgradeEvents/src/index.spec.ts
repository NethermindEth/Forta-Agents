import {
  TransactionEvent,
  FindingType,
  FindingSeverity,
  Finding,
  EventType,
  Network,
  HandleTransaction
} from 'forta-agent'

import agent, {
  generateHash,
  UPGRADE_EVENT_SIGNATURE,
  CONTRACT_ADDRESS
} from '.'

describe('Detect Upgrade Events', () => {
  let handleTransaction: HandleTransaction

  const createTxEvent = ({ logs, addresses }: any): TransactionEvent => {
    const tx: any = {}
    const receipt: any = { logs }
    const block: any = {}
    const address: any = { CONTRACT_ADDRESS, ...addresses }

    return new TransactionEvent(
      EventType.BLOCK,
      Network.MAINNET,
      tx,
      receipt,
      [],
      address,
      block
    )
  }

  beforeAll(() => {
    handleTransaction = agent.handleTransaction
  })

  describe('handleTransaction', () => {
    it('should return empty finding', async () => {
      const upgradeEvent = {
        topics: [],
        address: undefined
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
        topics: [upgradeEventTopic],
        address: CONTRACT_ADDRESS
      }

      const txEvent = createTxEvent({
        logs: [upgradeEvent]
      })

      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: 'Upgrade Event',
          description: `Upgrade Event is detected`,
          alertId: 'NETHFORTA-5',
          type: FindingType.Suspicious,
          severity: FindingSeverity.High,
          metadata: {
            proxy: CONTRACT_ADDRESS
          }
        })
      ])
    })
    it('should return empty finding for  contract address', async () => {
      const upgradeEventTopic: string = generateHash(UPGRADE_EVENT_SIGNATURE)

      const upgradeEvent = {
        topics: [upgradeEventTopic],
        address: undefined
      }

      const txEvent = createTxEvent({
        logs: [upgradeEvent]
      })

      const findings = await handleTransaction(txEvent)
      expect(findings).toStrictEqual([])
    })
  })
})
