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
import {
  provideHandleTransaction
} from "./agent"

const workEventSig: string = "Work(uint256,uint256)";
// NOTE: IS IT ENOUGH TO ONLY TEST WITH ONE VAULT
const BUSD_VAULT_ADDRESS: string = "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f";

const testPositionId: number = 123;
const testBorrowAmount = BigInt(500000000000000000000000); // 500,000 BUSD
const testMsgSender: string = createAddress('0x3');

const data: string = encodeParameters(
  ["uint256", "uint256"],
  [testPositionId, testBorrowAmount]
);

describe("Large Position Alert Agent - BUSD Vault", () => {
  let handleTransaction: HandleTransaction

  beforeAll(() => {
    handleTransaction = provideHandleTransaction();
  });

  it('should return a Finding from Work event emission in BUSD Vault', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(BUSD_VAULT_ADDRESS) // BUSD Vault
      .addEventLog(workEventSig, BUSD_VAULT_ADDRESS, data);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Large Position Event",
        description: "Large Position Has Been Taken",
        alertId: "ALPACA-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          positionId: testPositionId.toString(),
          loanAmount: testBorrowAmount.toString(),
          vault: BUSD_VAULT_ADDRESS.toLowerCase()
        }
      }),
    ]);
  });

  it('should return no Findings due to incorrect event signature', async () => {
    const badWorkSig: string = 'badSig';

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(BUSD_VAULT_ADDRESS, testMsgSender)
      .addEventLog(badWorkSig, BUSD_VAULT_ADDRESS, data);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should return no Findings due to wrong contract ddress', async () => {
    const wrongVaultAddress: string = createAddress('0x1111');

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(wrongVaultAddress, testMsgSender)
      .addEventLog(workEventSig,wrongVaultAddress);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should return no Findings due not passing borrow amount threshold', async () => {
    const lowBorrowAmount = BigInt(5000000000000000000000); // 5,000 BUSD

    const lowBorrowAmountData: string = encodeParameters(
      ["uint256", "uint256"],
      [testPositionId, lowBorrowAmount]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(BUSD_VAULT_ADDRESS, testMsgSender)
      .addEventLog(workEventSig, BUSD_VAULT_ADDRESS, lowBorrowAmountData);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
})