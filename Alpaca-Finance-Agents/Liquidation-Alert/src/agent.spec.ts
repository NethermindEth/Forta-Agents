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

const TEST_ALERT_ID: string = 'test';
const TEST_VAULT_ADDRESS = createAddress('0x4321');
const testMsgSender: string = createAddress('0x1234');

const killEventSig: string = "Kill(uint256,address,address,uint256,uint256,uint256,uint256)";

// PARAMS FOR EVENT
// TODO: GIVE THEM VALUES
const testId: number = 0;
const testKiller: string = " ";
const testOwner: string = " ";
const testPosVal: number = 0;
const testDebt: number = 0;
const testPrize: number = 0;


const data: string = encodeParameters(
  ["uint256","address","address", "uint256", "uint256", "uint256", "address"],
  [testId, testKiller, testOwner, testPosVal, testDebt, testPrize]
);

describe("Liquidation Alert Agent", () => {
  let handleTransaction: HandleTransaction

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(TEST_ALERT_ID);
  })

  it('should return a Finding from Kill event emission', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(TEST_VAULT_ADDRESS) // BUSD Vault
      .addEventLog(killEventSig, TEST_VAULT_ADDRESS, data);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Liquidation Event",
        description: "Liquidation Has Occurred",
        alertId: TEST_ALERT_ID,
        severity: FindingSeverity.Info,
        type: FindingType.Unknown,
        metadata: {
          id: testId.toString(),
          killer: testKiller,
          owner: testOwner,
          PosVal: testPosVal.toString(),
          debt: testDebt.toString(),
          prize: testPrize.toString()
        }
      }),
    ]);
  });
})
