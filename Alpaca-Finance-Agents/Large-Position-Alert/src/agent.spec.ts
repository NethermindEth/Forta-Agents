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
import {
  provideHandleTransaction,
  workEventSig,
  VAULT_ADDRESSES
} from "./agent"

const TEST_ALERT_ID: string = 'test';
// NOTE: IS IT *REQUIRED* TO HAVE MOCK VAULT ADDRESSES INSTEAD?
const BUSD_VAULT_FOR_TEST: string = "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f";
const ETH_VAULT_FOR_TEST: string = "0xbfF4a34A4644a113E8200D7F1D79b3555f723AfE";
const BTCB_VAULT_FOR_TEST: string = "0x08FC9Ba2cAc74742177e0afC3dC8Aed6961c24e7";
const USDT_VAULT_FOR_TEST: string = "0x08FC9Ba2cAc74742177e0afC3dC8Aed6961c24e7";
const ALPACA_VAULT_FOR_TEST: string = "0xf1bE8ecC990cBcb90e166b71E368299f0116d421";
const TUSD_VAULT_FOR_TEST: string = "0x3282d2a151ca00BfE7ed17Aa16E42880248CD3Cd";

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
    handleTransaction = provideHandleTransaction(TEST_ALERT_ID, VAULT_ADDRESSES); // NOTE: HAVE TO USE TEST ADDRESSES?
  });

  it('should return a Finding from Work event emission in BUSD Vault', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(BUSD_VAULT_FOR_TEST) // BUSD Vault
      .addEventLog(workEventSig, BUSD_VAULT_FOR_TEST, data);

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
      .addInvolvedAddresses(VAULT_ADDRESSES[0], testMsgSender)
      .addEventLog(badWorkSig, VAULT_ADDRESSES[0], data);

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
      .addInvolvedAddresses(VAULT_ADDRESSES[0], testMsgSender)
      .addEventLog(workEventSig, VAULT_ADDRESSES[0], lowBorrowAmountData);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
})