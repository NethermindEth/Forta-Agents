import {
  Finding,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { 
  createAddress, 
  encodeParameter, 
  TestTransactionEvent 
} from "forta-agent-tools";
import withdraw from "./withdraw";
import BigNumber from "bignumber.js";
import { createWithdrawFinding as createFinding } from "./utils";

const zeroAddr: string = createAddress("0x0");
const fakeVault: string = createAddress("0xdead");
const large: BigNumber = new BigNumber(20);

describe("Withdraw handler test suite", () => {
  const handler: HandleTransaction = withdraw.provideLargeWithdrawDetector(fakeVault, large);

  it("should ignore transactions with no events", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore not large withdrawals", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        withdraw.TRANSFER_SIGNATURE,
        fakeVault,
        encodeParameter('uint256', new BigNumber(10)),
        encodeParameter('address', createAddress("0x1")),
        encodeParameter('address', zeroAddr),
      )
      .addEventLog(
        withdraw.TRANSFER_SIGNATURE,
        fakeVault,
        encodeParameter('uint256', new BigNumber(17)),
        encodeParameter('address', createAddress("0x2")),
        encodeParameter('address', zeroAddr),
      )
      .addEventLog(
        withdraw.TRANSFER_SIGNATURE,
        fakeVault,
        encodeParameter('uint256', new BigNumber(1)),
        encodeParameter('address', createAddress("0x12")),
        encodeParameter('address', zeroAddr),
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });  

  it("should ignore withdrawals from other contracts", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        withdraw.TRANSFER_SIGNATURE,
        createAddress("0xcafe0"),
        encodeParameter('uint256', new BigNumber(100)),
        encodeParameter('address', createAddress("0x1")),
        encodeParameter('address', zeroAddr),
      )
      .addEventLog(
        withdraw.TRANSFER_SIGNATURE,
        createAddress("0xcafe1"),
        encodeParameter('uint256', new BigNumber(17)),
        encodeParameter('address', createAddress("0x2")),
        encodeParameter('address', zeroAddr),
      )
      .addEventLog(
        withdraw.TRANSFER_SIGNATURE,
        createAddress("0xdead0"),
        encodeParameter('uint256', new BigNumber(1)),
        encodeParameter('address', createAddress("0x12")),
        encodeParameter('address', zeroAddr),
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });  

  it("should ignore events with wrong signature", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        "Transfers(address,address,uint256)",
        fakeVault,
        encodeParameter('uint256', new BigNumber(100)),
        encodeParameter('address', createAddress("0x1")),
        encodeParameter('address', zeroAddr),
      )
      .addEventLog(
        "SomeEvent(address,address,uint256)",
        fakeVault,
        encodeParameter('uint256', new BigNumber(1700)),
        encodeParameter('address', createAddress("0x2")),
        encodeParameter('address', zeroAddr),
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });  

  it("should ignore regular Transfer events with `to` different of 0x0", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        withdraw.TRANSFER_SIGNATURE,
        fakeVault,
        encodeParameter('uint256', new BigNumber(100)),
        encodeParameter('address', createAddress("0x1")),
        encodeParameter('address', createAddress("0x32")),
      )
      .addEventLog(
        withdraw.TRANSFER_SIGNATURE,
        fakeVault,
        encodeParameter('uint256', new BigNumber(1700)),
        encodeParameter('address', createAddress("0x2")),
        encodeParameter('address', createAddress("0x3")),
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  }); 
  
  it("should detect large witdrawals", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        withdraw.TRANSFER_SIGNATURE,
        fakeVault,
        encodeParameter('uint256', new BigNumber(100)),
        encodeParameter('address', createAddress("0x1")),
        encodeParameter('address', zeroAddr),
      )
      .addEventLog(
        withdraw.TRANSFER_SIGNATURE,
        fakeVault,
        encodeParameter('uint256', new BigNumber(1700)),
        encodeParameter('address', createAddress("0x2")),
        encodeParameter('address', zeroAddr),
      )
      .addEventLog(
        withdraw.TRANSFER_SIGNATURE,
        fakeVault,
        encodeParameter('uint256', new BigNumber(20)),
        encodeParameter('address', createAddress("0x3")),
        encodeParameter('address', zeroAddr),
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding(fakeVault, createAddress("0x1"), new BigNumber(100)),
      createFinding(fakeVault, createAddress("0x2"), new BigNumber(1700)),
      createFinding(fakeVault, createAddress("0x3"), new BigNumber(20)),
    ]);
  }); 
});
