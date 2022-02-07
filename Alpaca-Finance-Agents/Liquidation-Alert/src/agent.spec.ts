import {
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
  createAgentThreeFinding,
  createAgentFourFinding 
} from "./agent";
import { BigNumber } from "ethers";

const TEST_VAULT_ADDRESSES: string[] = [
  createAddress("0x43ABc21fE").toLowerCase(),
  createAddress("0x98a7FEc65d4").toLowerCase()
];
const testMsgSender: string = createAddress("0x1fCc23aEe4");

const killEventSig: string = "Kill(uint256,address,address,uint256,uint256,uint256,uint256)";

describe("Liquidation Alert Agent", () => {
  let handleTransaction: HandleTransaction

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(TEST_VAULT_ADDRESSES);
  })

  it("should return a Finding from Kill event emission", async () => {
    const testId: number = 123;
    const testKiller: string = "0xD29126e4235551006331437DE4574a2F2BDc840d";
    const testOwner: string = "0x8311f4DC4fb2fD19D7A5b880C8c5fDb50B72E63E";
    const testPosVal: BigNumber = BigNumber.from("100000000000000000000000");  // 100,000
    const testDebt: BigNumber = BigNumber.from("10000000000000000000000");     // 10,000
    const testPrize: BigNumber = BigNumber.from("5000000000000000000000");     // 5,000
    const testLeft: BigNumber = BigNumber.from("85000000000000000000000");     // 85,000

    const data: string = encodeParameters(
      ["address", "uint256", "uint256", "uint256", "uint256"],
      [testOwner, testPosVal, testDebt, testPrize, testLeft]
    );

    const topics: string[] = [
      encodeParameters(["uint256"], [testId]),
      encodeParameters(["address"], [testKiller])
    ];

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(TEST_VAULT_ADDRESSES[0])
      .addEventLog(killEventSig, TEST_VAULT_ADDRESSES[0], data, ...topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createAgentThreeFinding(
        testId,
        testKiller,
        testOwner,
        testPosVal,
        testDebt,
        testPrize,
        testLeft,
        TEST_VAULT_ADDRESSES[0]
      )
    ])
  });

  it("should return no Findings due to incorrect event signature", async () => {
    const badWorkSig: string = "badSig";

    const testId: number = 456;
    const testKiller: string = "0x4eFA69dB78481dC0b4377d29dfE61397819b33b3";
    const testOwner: string = "0xD29126e4235551006331437DE4574a2F2BDc840d";
    const testPosVal: BigNumber = BigNumber.from("250000000000000000000000");  // 250,000
    const testDebt: BigNumber = BigNumber.from("50000000000000000000000");     // 50,000
    const testPrize: BigNumber = BigNumber.from("10000000000000000000000");    // 10,000
    const testLeft: BigNumber = BigNumber.from("190000000000000000000000");    // 190,000

    const data: string = encodeParameters(
      ["address", "uint256", "uint256", "uint256", "uint256"],
      [testOwner, testPosVal, testDebt, testPrize, testLeft]
    );

    const topics: string[] = [
      encodeParameters(["uint256"], [testId]),
      encodeParameters(["address"], [testKiller])
    ];

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(TEST_VAULT_ADDRESSES[0], testMsgSender)
      .addEventLog(badWorkSig, TEST_VAULT_ADDRESSES[0], data, ...topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return no Findings due to wrong contract ddress", async () => {
    const wrongVaultAddress: string = createAddress("0x75dFa");

    const testId: number = 789;
    const testKiller: string = "0x97f4012b156129a1c4cd2d1cf7d81d5db29ac3c6";
    const testOwner: string = "0x2f862e4fcc81bd8a13f851599c7ce5ca5307bdee";
    const testPosVal: BigNumber = BigNumber.from("435000000000000000000000");  // 435,000
    const testDebt: BigNumber = BigNumber.from("30000000000000000000000");     // 30,000
    const testPrize: BigNumber = BigNumber.from("5000000000000000000000");     // 5,000
    const testLeft: BigNumber = BigNumber.from("400000000000000000000000");    // 400,000

    const data: string = encodeParameters(
      ["address", "uint256", "uint256", "uint256", "uint256"],
      [testOwner, testPosVal, testDebt, testPrize, testLeft]
    );

    const topics: string[] = [
      encodeParameters(["uint256"], [testId]),
      encodeParameters(["address"], [testKiller])
    ];

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(wrongVaultAddress, testMsgSender)
      .addEventLog(killEventSig,wrongVaultAddress, data, ...topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a two Findings from Kill event emission due to 'left' being 0", async () => {
    const testId: number = 753;
    const testKiller: string = "0x9fe9db02D82B3522b2E5CEd47CAfCF48BA7bAb27";
    const testOwner: string = "0x35C830BBaD7b0A6e1eF6fA01103d1e761aE96216";
    const testPosVal: BigNumber = BigNumber.from("10000000000000000000000");   // 10,000
    const testDebt: BigNumber = BigNumber.from("5000000000000000000000");      // 5,000
    const testPrize: BigNumber = BigNumber.from("5000000000000000000000");     // 5,000
    const testLeft: BigNumber = BigNumber.from("0");                           // 0

    const data: string = encodeParameters(
      ["address", "uint256", "uint256", "uint256", "uint256"],
      [testOwner, testPosVal, testDebt, testPrize, testLeft]
    );

    const topics: string[] = [
      encodeParameters(["uint256"], [testId]),
      encodeParameters(["address"], [testKiller])
    ];


    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(TEST_VAULT_ADDRESSES[0])
      .addEventLog(killEventSig, TEST_VAULT_ADDRESSES[0], data, ...topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createAgentThreeFinding(
        testId,
        testKiller,
        testOwner,
        testPosVal,
        testDebt,
        testPrize,
        testLeft,
        TEST_VAULT_ADDRESSES[0]
      ),
      createAgentFourFinding(
        testId,
        testKiller,
        testOwner,
        testPosVal,
        testDebt,
        testPrize,
        testLeft,
        TEST_VAULT_ADDRESSES[0]
      )
    ]);
  });
})