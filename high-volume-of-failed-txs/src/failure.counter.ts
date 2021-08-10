interface TransactionDetails {
  hash: string,
  timestamp: number,
};

export default class FailureCounter {
  timeInterval: number
  transactionMap: {
    [key: string]: TransactionDetails[],
  }

  constructor(timeIntervalMins: number) {
    this.timeInterval = timeIntervalMins * 60 * 1000
    this.transactionMap = {}
  }

  failure(from: string, txHash: string, blockTimestamp: number): number {
    return 0
  }
}
