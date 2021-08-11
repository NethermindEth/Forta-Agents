import {
  TransactionEvent,
  FindingType,
  FindingSeverity,
  Finding,
  EventType,
  Network,
  HandleTransaction
} from 'forta-agent'

import agent, { DECIMALS, TX_VALUE_THRESHHOLD } from '.'

describe('Detect Very High Txn Value', () => {
  let handleTransaction: HandleTransaction

  beforeAll(() => {
    handleTransaction = agent.handleTransaction
  })

  const createTxEvent = ({
    transaction,
    addresses,
    blockNumber
  }: any): TransactionEvent => {
    const tx: any = {
      value: transaction.value
    }
    const receipt: any = {}
    const block: any = { number: blockNumber }
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

  describe('Handle Transaction', () => {
    it('returns empty findings if value is below threshold', async () => {
      const txEvent = createTxEvent({
        transaction: { value: 1 * DECIMALS }
      })

      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])
    })

    it('returns empty findings if value is equal to threshold', async () => {
      const txEvent = createTxEvent({
        transaction: { value: TX_VALUE_THRESHHOLD }
      })

      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])
    })

    it('returns a findings if value is above threshold', async () => {
      const value = 101 * DECIMALS
      const txEvent = createTxEvent({
        transaction: { value: value }
      })

      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: 'High Values Transaction Detected',
          description: `Value is: ${value}`,
          alertId: 'FORTA-1',
          severity: FindingSeverity.High,
          type: FindingType.Suspicious
        })
      ])
    })
  })
})
