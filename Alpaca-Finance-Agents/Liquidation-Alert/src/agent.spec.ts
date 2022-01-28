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
import { provideHandleTransaction } from "./agent"

const TEST_VAULT_ADDRESS = createAddress('0x4321');
const testMsgSender: string = createAddress('0x1234');

const killEventSig: string = "Kill(uint256,address,address,uint256,uint256,uint256,uint256)";

// PARAMS FOR EVENT
// TODO: GIVE THEM MORE LEGITIMATE VALUES
const testId: number = 1;
const testKiller: string = createAddress('0x0101');
const testOwner: string = createAddress('0x0202');
const testPosVal: number = 1;
const testDebt: number = 1;
const testPrize: number = 1;
const testLeft: number = 1;


const data: string = encodeParameters(
  ["uint256","address","address", "uint256", "uint256", "uint256", "uint256"],
  [testId, testKiller, testOwner, testPosVal, testDebt, testPrize, testLeft]
);

describe("Liquidation Alert Agent", () => {
  let handleTransaction: HandleTransaction

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(TEST_VAULT_ADDRESS);
  })

  it('should return a Finding from Kill event emission', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(TEST_VAULT_ADDRESS)
      .addEventLog(killEventSig, TEST_VAULT_ADDRESS, data);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Liquidation Event",
        description: "Liquidation Has Occurred",
        alertId: "ALPACA-3",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          positionId: testId.toString(),
          positionkiller: testKiller,
          positionOwner: testOwner,
          positionValue: testPosVal.toString(),
          debt: testDebt.toString(),
          prize: testPrize.toString(),
          left: testLeft.toString(),
          vault: TEST_VAULT_ADDRESS
        }
      }),
    ]);
  });

  it("should return no Findings due to incorrect event signature", async () => {
    const badWorkSig: string = 'badSig';

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(TEST_VAULT_ADDRESS, testMsgSender)
      .addEventLog(badWorkSig, TEST_VAULT_ADDRESS, data);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return no Findings due to wrong contract ddress", async () => {
    const wrongVaultAddress: string = createAddress("0x1111");

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(wrongVaultAddress, testMsgSender)
      .addEventLog(killEventSig,wrongVaultAddress);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
})