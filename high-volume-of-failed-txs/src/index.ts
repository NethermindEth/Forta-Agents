import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType 
} from 'forta-agent'
import BigNumber from 'bignumber.js'
import FailureCounter from './failure.counter'

const HIGH_FAILURE_THRESHOLD: string = "50"
const TIME_INTERVAL: number = 60; // 1 hour
const INTERSTING_PROTOCOLS: string[] = [
  "0xacd43e627e64355f1861cec6d3a6688b31a6f952", // Yearn Dai vault
]

const failureCounter: FailureCounter = new FailureCounter(TIME_INTERVAL)

function provideHandleTransaction(counter: FailureCounter): HandleTransaction {
  return async function handleTransaction(txEvent: TransactionEvent) {
    // report finding if a high volume of failed transaccion ocur within a defined time interval
    const findings: Finding[] = []

    return findings
  }
}

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(failureCounter),
}
