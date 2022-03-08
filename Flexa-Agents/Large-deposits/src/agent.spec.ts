import { HandleTransaction, TransactionEvent } from "forta-agent";
import {
  createAddress,
  TestTransactionEvent,
  encodeParameters,
  MockEthersProvider,
} from "forta-agent-tools";
import { createFinding, provideHandleTransaction } from "./agent";
import { BigNumber } from "ethers";
import { Interface } from "@ethersproject/abi";
import abi from "./abi";
import { leftPad } from "web3-utils";

const toBytes32 = (n: string) => leftPad(BigNumber.from(n).toHexString(), 64);
const testAmp: string = createAddress("0xdef1");
const testFlexa: string = createAddress("0xf1e4a");
const testThreshold: BigNumber = BigNumber.from(100);
const testAmpIFace: Interface = new Interface(abi.AMP_TOKEN);
const testFlexaIFace: Interface = new Interface(abi.FLEXA_CONTRACT);
const testFlag: string =
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

jest.setTimeout(1000000);

describe("Large stake deposits", () => {
  type TEST_CASE = [
    any,
    any,
    string,
    string,
    string,
    string,
    string,
    string,
    string
  ];

  let handleTransaction: HandleTransaction;
  const mockProvider = new MockEthersProvider();

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(
      testThreshold,
      testAmp,
      testFlexa,
      mockProvider as any
    );
  });

  beforeEach(() => mockProvider.clear());

  it("should return 0 findings in empty transactions", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return no Findings due to incorrect event signature", async () => {
    const testFromPartition: string =
      "0xcccccccc2862b8cb21caedb8706d7f8b3445d8dfc790c524e3990ef014e7c578";
    const testFrom: string = createAddress("0xabc123");
    const testTo: string = createAddress("0xabc456");

    const testOperator: string = createAddress(("0xdef123"));
    const bytesOperatorData: string = toBytes32("0x0123");
    const testValue: number = 100;

    const testDestinationPartition: string =
      "0xcccccccc7a0208a97d8ac263706d7f8b3445d8dfc790c524e3990ef014e7d679";
    const testData: string = encodeParameters(
      ["bytes32", "bytes32"],
      [testFlag, testDestinationPartition]
    );

    const { data, topics } = testAmpIFace.encodeEventLog(
      testAmpIFace.getEvent("TransferByPartition"),
      [
        testFromPartition,
        testOperator,
        testFrom,
        testTo,
        testValue,
        testData,
        bytesOperatorData,
      ]
    );

    const badWorkSig: string = "wrong";

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(50)
      .addEventLog(badWorkSig, testAmp, data, ...topics.slice(1));

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should returns no findings if value is lesser than threshold", async () => {
    const testFromPartition: string =
      "0xcccccccc2862b8cb21caedb8706d7f8b3445d8dfc790c524e3990ef014e7c578";
    const testFrom: string = createAddress("0xabc789");
    const testTo: string = createAddress("0xabc963");

    const testOperator: string = createAddress("0xdef456");
    const bytesOperatorData: string = toBytes32("0x0456");
    const testValue: number = 10;

    const testDestinationPartition: string =
      "0xcccccccc7a0208a97d8ac263706d7f8b3445d8dfc790c524e3990ef014e7d679";
    const testData: string = encodeParameters(
      ["bytes32", "bytes32"],
      [testFlag, testDestinationPartition]
    );

    const { data, topics } = testAmpIFace.encodeEventLog(
      testAmpIFace.getEvent("TransferByPartition"),
      [
        testFromPartition,
        testOperator,
        testFrom,
        testTo,
        testValue,
        testData,
        bytesOperatorData,
      ]
    );

    // prepare the partitions call
    mockProvider.addCallTo(testFlexa, 55, testFlexaIFace, "partitions", {
      inputs: [testDestinationPartition],
      outputs: [true],
    });

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(55)
      .addAnonymousEventLog(testAmp, data, ...topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should returns findings if value is equal to threshold", async () => {
    const testFromPartition: string =
      "0xcccccccc2862b8cb21caedb8706d7f8b3445d8dfc790c524e3990ef014e7c578";
    const testFrom: string = createAddress("0xabc369");
    const testTo: string = createAddress("0xabc258");

    const testOperator: string = createAddress("0xdef789");
    const bytesOperatorData: string = toBytes32("0x0789");
    const testValue: number = 100;

    const testDestinationPartition: string =
      "0xcccccccc7a0208a97d8ac263706d7f8b3445d8dfc790c524e3990ef014e7d679";
    const testData: string = encodeParameters(
      ["bytes32", "bytes32"],
      [testFlag, testDestinationPartition]
    );

    const { data, topics } = testAmpIFace.encodeEventLog(
      testAmpIFace.getEvent("TransferByPartition"),
      [
        testFromPartition,
        testOperator,
        testFrom,
        testTo,
        testValue,
        testData,
        bytesOperatorData,
      ]
    );

    // prepare the partitions call
    mockProvider.addCallTo(testFlexa, 60, testFlexaIFace, "partitions", {
      inputs: [testDestinationPartition],
      outputs: [true],
    });

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(60)
      .addAnonymousEventLog(testAmp, data, ...topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(
        testThreshold,
        testValue,
        testFromPartition,
        testOperator,
        testFrom,
        testDestinationPartition,
        testTo
      ),
    ]);
  });

  it("should returns findings if value is greater than threshold", async () => {
    const testFromPartition: string =
      "0xcccccccc2862b8cb21caedb8706d7f8b3445d8dfc790c524e3990ef014e7c578";
    const testFrom: string = createAddress("0xabc147");
    const testTo: string = createAddress("0xabc159");

    const testOperator: string = createAddress("0xdef963");
    const bytesOperatorData: string = toBytes32("0x0357");
    // const testValue: BigNumber = BigNumber.from(10000000);
    const testValue: number = 10000000;

    const testDestinationPartition: string =
      "0xcccccccc7a0208a97d8ac263706d7f8b3445d8dfc790c524e3990ef014e7d679";
    const testData: string = encodeParameters(
      ["bytes32", "bytes32"],
      [testFlag, testDestinationPartition]
    );

    const { data, topics } = testAmpIFace.encodeEventLog(
      testAmpIFace.getEvent("TransferByPartition"),
      [
        testFromPartition,
        testOperator,
        testFrom,
        testTo,
        testValue,
        testData,
        bytesOperatorData,
      ]
    );

    // prepare the partitions call
    mockProvider.addCallTo(testFlexa, 65, testFlexaIFace, "partitions", {
      inputs: [testDestinationPartition],
      outputs: [true],
    });

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(65)
      .addAnonymousEventLog(testAmp, data, ...topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(
        testThreshold,
        testValue,
        testFromPartition,
        testOperator,
        testFrom,
        testDestinationPartition,
        testTo
      ),
    ]);
  });

  it("should return multiple findings", async () => {
    const CASES: TEST_CASE[] = [
      // Format: [threshold, amount, partition, operator, from, destinationPartition, to, data, operatorData]
      [
        testThreshold,
        110,
        "0xcccccccc2862b8cb21caedb8706d7f8b3445d8dfc790c524e3990ef014e7c578",
        createAddress("0xe0a"),
        createAddress("0xabc1"),
        "0xcccccccc7a0208a97d8ac263706d7f8b3445d8dfc790c524e3990ef014e7c578",
        createAddress("0xabc1"),
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffcccccccc7a0208a97d8ac263706d7f8b3445d8dfc790c524e3990ef014e7c578",
        "0x0123"
      ],
      [
        testThreshold,
        115,
        "0xcccccccc2862b8cb21caedb8706d7f8b3445d8dfc790c524e3990ef014e7c578",
        createAddress("0xe0a"),
        createAddress("0xabc1"),
        "0xcccccccc7a0208a97d8ac263706d7f8b3445d8dfc790c524e3990ef014e7c578",
        createAddress("0xabc1"),
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffcccccccc7a0208a97d8ac263706d7f8b3445d8dfc790c524e3990ef014e7c578",
        "0x0123"
      ]
    ];

    const { data: dataOne, topics: topicsOne } = testAmpIFace.encodeEventLog(
      testAmpIFace.getEvent("TransferByPartition"),
      [CASES[0][2], CASES[0][3], CASES[0][4], CASES[0][6], CASES[0][2], CASES[0][7], CASES[0][8]]
    );

    const { data: dataTwo, topics: topicsTwo } = testAmpIFace.encodeEventLog(
      testAmpIFace.getEvent("TransferByPartition"),
      [CASES[1][2], CASES[1][3], CASES[1][4], CASES[1][6], CASES[1][2], CASES[1][7], CASES[1][8]]
    );

    let txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(70)
      .addAnonymousEventLog(testAmp, dataOne, ...topicsOne)
      .addAnonymousEventLog(testAmp, dataTwo, ...topicsTwo);

    mockProvider.addCallTo(testFlexa, 70, testFlexaIFace, "partitions", {
      inputs: [CASES[0][5]],
      outputs: [true],
    });
    mockProvider.addCallTo(testFlexa, 70, testFlexaIFace, "partitions", {
      inputs: [CASES[1][5]],
      outputs: [true],
    });

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      createFinding(
        CASES[0][0],
        CASES[0][1],
        CASES[0][2],
        CASES[0][3],
        CASES[0][4],
        CASES[0][5],
        CASES[0][6]
      ),
      createFinding(
        CASES[1][0],
        CASES[1][1],
        CASES[1][2],
        CASES[1][3],
        CASES[1][4],
        CASES[1][5],
        CASES[1][6]
      )
    ]);
  });

  it("should return no findings when event is not emitted in the correct address", async () => {
    const wrongAmpToken: string = createAddress("0xd34d");

    const testFromPartition: string =
      "0xcccccccc2862b8cb21caedb8706d7f8b3445d8dfc790c524e3990ef014e7c578";
    const testFrom: string = createAddress("0xabc268");
    const testTo: string = createAddress("0xabc842");

    const testOperator: string = createAddress("0xdef954");
    const bytesOperatorData: string = toBytes32("0x0951");
    const testValue: number = 200;

    const testDestinationPartition: string =
      "0xcccccccc7a0208a97d8ac263706d7f8b3445d8dfc790c524e3990ef014e7d679";
    const testData: string = encodeParameters(
      ["bytes32", "bytes32"],
      [testFlag, testDestinationPartition]
    );

    const { data, topics } = testAmpIFace.encodeEventLog(
      testAmpIFace.getEvent("TransferByPartition"),
      [
        testFromPartition,
        testOperator,
        testFrom,
        testTo,
        testValue,
        testData,
        bytesOperatorData,
      ]
    );

    // prepare the partitions call
    mockProvider.addCallTo(testFlexa, 75, testFlexaIFace, "partitions", {
      inputs: [testDestinationPartition],
      outputs: [true],
    });

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(75)
      .addAnonymousEventLog(wrongAmpToken, data, ...topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
