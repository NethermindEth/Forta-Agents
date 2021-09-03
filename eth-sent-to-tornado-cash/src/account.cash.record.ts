export type cashIn = {
    amount: bigint,
    timestamp: bigint,
}

export const createCashIn = (amount: bigint, timestamp: bigint): cashIn => {
    return {
        amount: amount,
        timestamp: timestamp,    
    };
}

export default class AccountCashRecord {
    private cashIns: cashIn[];
    private amountIn: bigint;
    private timeLimit: bigint;
    private biggerTimestamp: bigint;

    constructor(timeLimit: bigint) {
        this.cashIns = [];
        this.amountIn = BigInt(0);
        this.biggerTimestamp = BigInt(0);
        this.timeLimit = timeLimit;
    }

    private updateCashIns() {
        this.cashIns = this.cashIns.filter(({ timestamp }) => this.biggerTimestamp - timestamp <= this.timeLimit);
    }

    private updateAmountIn() {
        this.amountIn = this.cashIns.reduce((acum, { amount }) => acum + amount, BigInt(0));
    }

    public addCashIn(cashIn: cashIn)  {
        if (cashIn.timestamp > this.biggerTimestamp) {
            this.biggerTimestamp = cashIn.timestamp;
            this.cashIns.push(cashIn);
            this.updateCashIns();
            this.updateAmountIn();
            
        } else if (this.biggerTimestamp - cashIn.timestamp < this.timeLimit) {
            this.cashIns.push(cashIn);
            this.updateCashIns();
            this.updateAmountIn();
        }
    }

    public getAmountIn(): bigint  {
       return this.amountIn; 
    }
}