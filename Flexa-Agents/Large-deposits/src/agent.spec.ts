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
const testFlexaIFace: Interface = new Interface(abi.COLLATERAL_MANAGER);
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
    const testFromPartition: string = toBytes32("0xc578");
    const testFrom: string = createAddress("0xabc123");
    const testTo: string = createAddress("0xabc456");

    const testOperator: string = createAddress(("0xdef123"));
    const bytesOperatorData: string = toBytes32("0x0123");
    const testValue: BigNumber = BigNumber.from(100);

    const testDestinationPartition: string = toBytes32("0xd679");
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
      .addEventLog(badWorkSig, testAmp, data, ...topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should only return findings if value is equal to or greater than threshold", async () => {
    // CASES Format: [less than threshold, equal to threshold, more than threshold]
    // Individual Case Format: [threshold, amount, partition, operator, from, destinationPartition, to, data, operatorData]
    const CASES: TEST_CASE[] = [
      [
        testThreshold,
        BigNumber.from(10), // Less than threshold
        toBytes32("0xa123"),
        createAddress("0xabc123"),
        createAddress("0xabc456"),
        toBytes32("0xb456"),
        createAddress("0xabc789"),
        encodeParameters(["bytes32", "bytes32"], [testFlag, toBytes32("0xb456")]),
        toBytes32("0x0456")
      ],
      [
        testThreshold,
        BigNumber.from(100), // Equal to threshold
        toBytes32("0xc789"),
        createAddress("0xdef123"),
        createAddress("0xdef456"),
        toBytes32("0xd147"),
        createAddress("0xdef789"),
        encodeParameters(["bytes32", "bytes32"], [testFlag, toBytes32("0xd147")]),
        toBytes32("0x0789")
      ],
      [
        testThreshold,
        BigNumber.from(10000000), // More than threshold
        toBytes32("0xe258"),
        createAddress("0xaec123"),
        createAddress("0xdbf456"),
        toBytes32("0xf369"),
        createAddress("0xaec789"),
        encodeParameters(["bytes32", "bytes32"], [testFlag, toBytes32("0xf369")]),
        toBytes32("0x0357")
      ]
    ];

    const { data: dataOne, topics: topicsOne } = testAmpIFace.encodeEventLog(
      testAmpIFace.getEvent("TransferByPartition"),
      [CASES[0][2], CASES[0][3], CASES[0][4], CASES[0][6], CASES[0][1], CASES[0][7], CASES[0][8]]
    );

    const { data: dataTwo, topics: topicsTwo } = testAmpIFace.encodeEventLog(
      testAmpIFace.getEvent("TransferByPartition"),
      [CASES[1][2], CASES[1][3], CASES[1][4], CASES[1][6], CASES[1][1], CASES[1][7], CASES[1][8]
      ]
    );

    const { data: dataThree, topics: topicsThree } = testAmpIFace.encodeEventLog(
      testAmpIFace.getEvent("TransferByPartition"),
      [CASES[2][2], CASES[2][3], CASES[2][4], CASES[2][6], CASES[2][1], CASES[2][7], CASES[2][8]]
    );

    // prepare the partitions call
    mockProvider.addCallTo(testFlexa, 55, testFlexaIFace, "partitions", {
      inputs: [CASES[0][5]],
      outputs: [true],
    });
    mockProvider.addCallTo(testFlexa, 55, testFlexaIFace, "partitions", {
      inputs: [CASES[1][5]],
      outputs: [true],
    });
    mockProvider.addCallTo(testFlexa, 55, testFlexaIFace, "partitions", {
      inputs: [CASES[2][5]],
      outputs: [true],
    });

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(55)
      .addAnonymousEventLog(testAmp, dataOne, ...topicsOne)
      .addAnonymousEventLog(testAmp, dataTwo, ...topicsTwo)
      .addAnonymousEventLog(testAmp, dataThree, ...topicsThree);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(
        testThreshold,
        CASES[1][1],
        CASES[1][2],
        CASES[1][3],
        CASES[1][4],
        CASES[1][5],
        CASES[1][6]
      ),
      createFinding(
        testThreshold,
        CASES[2][1],
        CASES[2][2],
        CASES[2][3],
        CASES[2][4],
        CASES[2][5],
        CASES[2][6]
      ),
    ]);
  });

  it("should return no findings when event is not emitted in the correct address", async () => {
    const wrongAmpToken: string = createAddress("0xd34d");

    const testFromPartition: string = toBytes32("0xc578");
    const testFrom: string = createAddress("0xabc268");
    const testTo: string = createAddress("0xabc842");

    const testOperator: string = createAddress("0xdef954");
    const bytesOperatorData: string = toBytes32("0x0951");
    const testValue: BigNumber = BigNumber.from(200);

    const testDestinationPartition: string = toBytes32("0xd679");
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
