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

describe('Very high Txn Value', () => {
  let handleTransaction1: HandleTransaction

  beforeAll(() => {
    handleTransaction1 = agent.handleTransaction
  })

  const createTxEvent = ({
    transaction,
    addresses,
    logs,
    blockNumber
  }: any): TransactionEvent => {
    const tx = {
      value: transaction.value
    } as any
    const receipt: any = {}
    const block = { number: blockNumber } as any
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

      const findings = await handleTransaction1(txEvent)

      expect(findings).toStrictEqual([])
    })

    it('returns a findings if value is above threshold', async () => {
      const txEvent = createTxEvent({
        transaction: { value: 11 * DECIMALS }
      })

      const findings = await handleTransaction1(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: 'High Values Transaction Detected',
          description: `Value is: ${11 * DECIMALS}`,
          alertId: 'FORTA-1',
          severity: FindingSeverity.High,
          type: FindingType.Suspicious
        })
      ])
    })
  })
})
