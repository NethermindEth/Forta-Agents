import BigNumber from 'bignumber.js'
import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent
} from "forta-agent"
import { 
  createAddress,
  TestTransactionEvent,
  encodeParameters
} from "forta-agent-tools";
import { provideHandleTransaction,
  POOL_ADDRESS,
  workEventSig
} from "./agent"

const TEST_ALERT_ID: string = 'test';

const testPositionId: number = 123;
const testBorrowAmount = new BigNumber(500000000000000000000);
const testMsgSender: string = createAddress('0x3');

const data: string = encodeParameters(
  ["uint256", "uint256"],
  [testPositionId, testBorrowAmount]
);

describe("Large Position Alert Agent", () => {
  let handleTransaction: HandleTransaction

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(TEST_ALERT_ID, POOL_ADDRESS);
  });

  it('should return a Finding from Work event emission', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(POOL_ADDRESS)
      .addEventLog(workEventSig, POOL_ADDRESS, data);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Large Position Event",
        description: "Large Position Has Been Taken",
        alertId: TEST_ALERT_ID,
        severity: FindingSeverity.Info,
        type: FindingType.Unknown,
        metadata: {
          positionId: testPositionId.toString(),
          borrowAmount: testBorrowAmount.toString()
        }
      }),
    ]);
  });

  it('should return no Findings due to incorrect event signature', async () => {
    const badWorkSig: string = 'badSig';

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(POOL_ADDRESS, testMsgSender)
      .addEventLog(badWorkSig, POOL_ADDRESS, data);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should return no Findings due to wrong contract ddress', async () => {
    const wrongContractAddress: string = createAddress('0x1111');

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(wrongContractAddress, testMsgSender)
      .addEventLog(workEventSig,wrongContractAddress);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
})