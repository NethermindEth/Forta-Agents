import { Interface } from "ethers/lib/utils";
import { Finding, HandleTransaction, TransactionEvent, ethers } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { DEPOSIT_ABI, BORROW_ABI, FLASHLOAN_ABI, createFinding } from "./utils";

describe("Flash loan with Deposit or Borrow events detection bot test suite", () => {
  const lendingPool = createAddress("0x1");

  const handler: HandleTransaction = provideHandleTransaction(lendingPool);

  const EVENTS_IFACE = new Interface([FLASHLOAN_ABI, BORROW_ABI, DEPOSIT_ABI]);

  const IRRELEVANT_EVENT_IFACE = new Interface([
    "event IrrelevantEvent(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint16 indexed referral)",
  ]);

  it("should ignore empty transactions", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore irrelevant event on the same contract", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .setTo(createAddress("0xa1"))
      .addInterfaceEventLog(IRRELEVANT_EVENT_IFACE.getEvent("IrrelevantEvent"), lendingPool, [
        createAddress("0x1"), // reserve
        createAddress("0x2"), // user
        createAddress("0x3"), // onBehalfOf
        ethers.BigNumber.from("4000000000"), // amount
        2, // referral
      ])
      .addInterfaceEventLog(EVENTS_IFACE.getEvent("Deposit"), lendingPool, [
        createAddress("0x1"), // reserve
        createAddress("0x2"), // user
        createAddress("0x3"), // onBehalfOf
        ethers.BigNumber.from("4000000000"), // amount
        2, // referral
      ])
      .addInterfaceEventLog(EVENTS_IFACE.getEvent("FlashLoan"), lendingPool, [
        createAddress("0x1"), // target
        createAddress("0x2"), // initiator
        createAddress("0x3"), // asset
        ethers.BigNumber.from("4000000000"), // amount
        ethers.BigNumber.from("1000000000"), // premium
        1, // referralCode
      ]);

    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([createFinding("Deposit", tx.transaction.from, tx.transaction.to)]);
  });

  it("should ignore events emitted on a different contract", async () => {
    const differentContract = createAddress("0xd1");

    const tx: TransactionEvent = new TestTransactionEvent()
      .setTo(createAddress("0xa1"))
      .addInterfaceEventLog(EVENTS_IFACE.getEvent("Deposit"), differentContract, [
        createAddress("0x1"), // reserve
        createAddress("0x2"), // user
        createAddress("0x3"), // onBehalfOf
        ethers.BigNumber.from("4000000000"), // amount
        2, // referral
      ])
      .addInterfaceEventLog(EVENTS_IFACE.getEvent("FlashLoan"), differentContract, [
        createAddress("0x1"), // target
        createAddress("0x2"), // initiator
        createAddress("0x3"), // asset
        ethers.BigNumber.from("4000000000"), // amount
        ethers.BigNumber.from("1000000000"), // premium
        1, // referralCode
      ]);

    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([]);
  });

  it("should detect when Deposit and FlashLoan events are emitted in the same tx", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .setTo(createAddress("0xa1"))
      .addInterfaceEventLog(EVENTS_IFACE.getEvent("Deposit"), lendingPool, [
        createAddress("0x1"), // reserve
        createAddress("0x2"), // user
        createAddress("0x3"), // onBehalfOf
        ethers.BigNumber.from("4000000000"), // amount
        2, // referral
      ])
      .addInterfaceEventLog(EVENTS_IFACE.getEvent("FlashLoan"), lendingPool, [
        createAddress("0x1"), // target
        createAddress("0x2"), // initiator
        createAddress("0x3"), // asset
        ethers.BigNumber.from("4000000000"), // amount
        ethers.BigNumber.from("1000000000"), // premium
        1, // referralCode
      ]);

    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([createFinding("Deposit", tx.transaction.from, tx.transaction.to)]);
  });

  it("should detect when Borrow and FlashLoan events are emitted in the same tx", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .setTo(createAddress("0xb1"))
      .addInterfaceEventLog(EVENTS_IFACE.getEvent("Borrow"), lendingPool, [
        createAddress("0x1"), // reserve
        createAddress("0x2"), // user
        createAddress("0x3"), // onBehalfOf
        ethers.BigNumber.from("3000000000"), // amount
        ethers.BigNumber.from("1000000000"), // borrowRateMode
        ethers.BigNumber.from("2000000000"), // borrowRate
        1, // referral
      ])
      .addInterfaceEventLog(EVENTS_IFACE.getEvent("FlashLoan"), lendingPool, [
        createAddress("0x1"), // target
        createAddress("0x2"), // initiator
        createAddress("0x3"), // asset
        ethers.BigNumber.from("4000000000"), // amount
        ethers.BigNumber.from("1000000000"), // premium
        2, // referralCode
      ]);

    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([createFinding("Borrow", tx.transaction.from, tx.transaction.to)]);
  });

  it("should detect multiple findings when Borrow, Deposit and FlashLoan events are emitted in the same tx", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .setTo(createAddress("0xb1"))
      .addInterfaceEventLog(EVENTS_IFACE.getEvent("Borrow"), lendingPool, [
        createAddress("0x1"), // reserve
        createAddress("0x2"), // user
        createAddress("0x3"), // onBehalfOf
        ethers.BigNumber.from("4000000000"), // amount
        ethers.BigNumber.from("1000000000"), // borrowRateMode
        ethers.BigNumber.from("2000000000"), // borrowRate
        1, // referral
      ])
      .addInterfaceEventLog(EVENTS_IFACE.getEvent("Deposit"), lendingPool, [
        createAddress("0x4"), // reserve
        createAddress("0x5"), // user
        createAddress("0x6"), // onBehalfOf
        ethers.BigNumber.from("5000000000"), // amount
        2, // referral
      ])
      .addInterfaceEventLog(EVENTS_IFACE.getEvent("FlashLoan"), lendingPool, [
        createAddress("0x1"), // target
        createAddress("0x2"), // initiator
        createAddress("0x3"), // asset
        ethers.BigNumber.from("4000000000"), // amount
        ethers.BigNumber.from("1000000000"), // premium
        3, // referralCode
      ]);

    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([
      createFinding("Deposit", tx.transaction.from, tx.transaction.to),
      createFinding("Borrow", tx.transaction.from, tx.transaction.to),
    ]);
  });
});
