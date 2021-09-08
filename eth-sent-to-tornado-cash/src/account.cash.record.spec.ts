import AccountCashRecord, { createCashIn } from "./account.cash.record";

describe("AccountCashRecord test suite", () => {
  it("should return amount 0 at creation", () => {
    const accountCashRecord = new AccountCashRecord(BigInt(0));
    expect(accountCashRecord.getAmountIn()).toStrictEqual(BigInt(0));
  });

  it("should return the sum of all cashIn inside ", () => {
    const accountCashRecord = new AccountCashRecord(BigInt(10000));

    accountCashRecord.addCashIn(createCashIn(BigInt(100), BigInt(1000)));
    accountCashRecord.addCashIn(createCashIn(BigInt(50), BigInt(2000)));
    accountCashRecord.addCashIn(createCashIn(BigInt(40), BigInt(1800)));
    accountCashRecord.addCashIn(createCashIn(BigInt(2000), BigInt(10050)));

    expect(accountCashRecord.getAmountIn()).toStrictEqual(BigInt(2190));
  });

  it("should take in acount only cashIn in the timeLimit frame", () => {
    const accountCashRecord = new AccountCashRecord(BigInt(1000));

    accountCashRecord.addCashIn(createCashIn(BigInt(100), BigInt(50)));
    accountCashRecord.addCashIn(createCashIn(BigInt(200), BigInt(500)));
    accountCashRecord.addCashIn(createCashIn(BigInt(250), BigInt(1000)));
    accountCashRecord.addCashIn(createCashIn(BigInt(50), BigInt(1051)));

    expect(accountCashRecord.getAmountIn()).toStrictEqual(BigInt(500));
  });

  it("should define time frame using the cashIn with bigger timestamp", () => {
    const accountCashRecord = new AccountCashRecord(BigInt(1000));

    accountCashRecord.addCashIn(createCashIn(BigInt(100), BigInt(50)));
    accountCashRecord.addCashIn(createCashIn(BigInt(50), BigInt(1051)));
    accountCashRecord.addCashIn(createCashIn(BigInt(250), BigInt(1000)));
    accountCashRecord.addCashIn(createCashIn(BigInt(200), BigInt(500)));

    expect(accountCashRecord.getAmountIn()).toStrictEqual(BigInt(500));
  });
});
