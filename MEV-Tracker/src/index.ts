import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from 'forta-agent'
import axios from 'axios'

const INTERESTING_PROTOCOLS: string[] = [
  '0x11111112542d85b3ef69ae05771c2dccff4faa26'.toLowerCase(), // 1inch V3
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d'.toLowerCase(), // Uniswap V2
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f'.toLowerCase(), // SushiSwap Router
]
const API_ENDPOINT: string =
  'https://blocks.flashbots.net/v1/blocks?block_number='

export const getAPIUrl = (block: number) => `${API_ENDPOINT}${block}`

const provideHandleTransaction = (
  getter: any,
  protocols: string[]
): HandleTransaction => {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = []

    const protocolsInUse: string[] = protocols.filter(
      (p: string) => txEvent.addresses[p]
    )

    if (protocolsInUse.length === 0) return findings

    const { data } = await getter(getAPIUrl(txEvent.blockNumber))

    // check if the block has a bundle
    if (data.blocks.length === 0) return findings
    // check if the transaction is inside the bundle
    const currentTxn = data.blocks[0].transactions.filter(
      (txn: any) => txn.transaction_hash === txEvent.hash
    )
    if (currentTxn.length === 0) return findings
    const txn = currentTxn[0]

    // report findings
    protocolsInUse.forEach((p: string) => {
      findings.push(
        Finding.fromObject({
          name: 'Protocol interaction inside a MEV bundle',
          description: `Protocol used (${p})`,
          alertId: 'NETHERMIND-AGENTS-10',
          type: FindingType.Suspicious,
          severity: FindingSeverity.Info,
          metadata: {
            bundle_type: txn.bundle_type,
            hash: txEvent.hash,
          },
        })
      )
    })

    return findings
  }
}

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(axios.get, INTERESTING_PROTOCOLS),
}
