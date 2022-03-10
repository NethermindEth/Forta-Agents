import {
  Finding,
  FindingSeverity,
  FindingType, 
  HandleTransaction, 
  TransactionEvent
} from "forta-agent";
import {
  createAddress,
  TestTransactionEvent,
  encodeParameters,
  MockEthersProvider,
} from "forta-agent-tools";
import { provideHandleTransaction } from "./agent";
import { BigNumber } from "ethers";
import { Interface } from "@ethersproject/abi";
import util from "./utils";
import { leftPad } from "web3-utils";

const toBytes32 = (n: string) => leftPad(BigNumber.from(n).toHexString(), 64);
const testAmp: string = createAddress("0xdef1");
const testFlexa: string = createAddress("0xf1e4a");
const testThreshold: BigNumber = BigNumber.from(100); // $100
const testAmpIFace: Interface = new Interface(util.AMP_TOKEN);
const testFlexaIFace: Interface = new Interface(util.COLLATERAL_MANAGER);
const testFlag: string =
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
const PRICE_CORRECTION: BigNumber = BigNumber.from(10).pow(8);
const AMOUNT_CORRECTION: BigNumber = BigNumber.from(10).pow(18);
const TOKEN_PRICE = BigNumber.from(10).mul(PRICE_CORRECTION);

const createFinding = ([
  value,
  fromPartition,
  operator, 
  from,
  destinationPartition,
  to, 
  operatorData,
]: string[]) => Finding.fromObject({
  name: "Large Deposit",
  description: "Large Deposit into staking pool",
  alertId: "FLEXA-2",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  protocol: "Flexa",
  metadata: {
    value, 
    fromPartition,
    operator, 
    from,
    destinationPartition,
    to, 
    operatorData,
  },
});

describe("Large stake deposits", () => {
  let handleTransaction: HandleTransaction;
  const mockPrice = jest.fn();
  const mockFetcher = {
    getAmpPrice: mockPrice,
  };
  const mockProvider = new MockEthersProvider();
  
  beforeAll(() => {
    mockPrice.mockReturnValue([1, TOKEN_PRICE, 2, 3, 1]);
    handleTransaction = provideHandleTransaction(
      testThreshold,
      testAmp,
      testFlexa,
      mockProvider as any,
      mockFetcher as any,
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

    const testOperator: string = createAddress("0xdef123");
    const bytesOperatorData: string = toBytes32("0x0123");
    const testValue: BigNumber = BigNumber.from(100).mul(AMOUNT_CORRECTION);

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

    const badWorkSig: string = "wrong()";

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(50)
      .addEventLog(badWorkSig, testAmp, data, ...topics.slice(1));

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should only return findings if value is equal to or greater than threshold", async () => {
    // CASES Format: [less than threshold, equal to threshold, more than threshold]
    // Individual Case Format: [amount, partition, operator, from, destinationPartition, to, operatorData]
    const CASES: string[][] = [
      [
        BigNumber.from(1).mul(AMOUNT_CORRECTION).toString(), // Less than threshold (1 token @ $10)
        toBytes32("0xa123"),
        createAddress("0xabc123"),
        createAddress("0xabc456"),
        toBytes32("0xb456"),
        createAddress("0xabc789"),
        toBytes32("0x0456")
      ],
      [
        BigNumber.from(10).mul(AMOUNT_CORRECTION).toString(), // Equal to threshold (10 tokens @ $10)
        toBytes32("0xc789"),
        createAddress("0xdef123"),
        createAddress("0xdef456"),
        toBytes32("0xd147"),
        createAddress("0xdef789"),
        toBytes32("0x0789")
      ],
      [
        BigNumber.from(10000000).mul(AMOUNT_CORRECTION).toString(), // More than threshold (10,000,000 tokens @ $10)
        toBytes32("0xe258"),
        createAddress("0xaec123"),
        createAddress("0xdbf456"),
        toBytes32("0xf369"),
        createAddress("0xaec789"),
        toBytes32("0x0357")
      ]
    ];

    const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(55);

    for(let [amount, partition, operator, from, destinationPartition, to, operatorData] of CASES) {
      // join flag & destination
      const encodedDestination: string = encodeParameters(["bytes32", "bytes32"], [testFlag, destinationPartition]);
      // encode the event
      const { data, topics } = testAmpIFace.encodeEventLog(
        testAmpIFace.getEvent("TransferByPartition"),
        [partition, operator, from, to, amount, encodedDestination, operatorData]
      );
      // prepare the partitions call
      mockProvider.addCallTo(testFlexa, 55, testFlexaIFace, "partitions", {
        inputs: [destinationPartition],
        outputs: [true],
      });
      // prepare the txn
      txEvent.addAnonymousEventLog(testAmp, data, ...topics);
    }

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(CASES[1]),
      createFinding(CASES[2]),
    ]);
  });

  it("should return no findings when event is not emitted in the correct address", async () => {
    const wrongAmpToken: string = createAddress("0xd34d");

    const testFromPartition: string = toBytes32("0xc578");
    const testFrom: string = createAddress("0xabc268");
    const testTo: string = createAddress("0xabc842");

    const testOperator: string = createAddress("0xdef954");
    const bytesOperatorData: string = toBytes32("0x0951");
    const testValue: BigNumber = BigNumber.from(200).mul(AMOUNT_CORRECTION);

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

  it("should return empty findings when the transfer is emitted from a non-flexa partition", async () => {
    // When partitions mapping is false

    const testFromPartition: string = toBytes32("0xc571");
    const testFrom: string = createAddress("0xabc258");
    const testTo: string = createAddress("0xabc841");

    const testOperator: string = createAddress("0xdef954");
    const bytesOperatorData: string = toBytes32("0x0952");
    const testValue: BigNumber = BigNumber.from(200).mul(AMOUNT_CORRECTION);

    const testDestinationPartition: string = toBytes32("0xd689");
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
      outputs: [false],
    });

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(75)
      .addAnonymousEventLog(testAmp, data, ...topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should use fromPartition as destinationPartition", async () => {
    const testFromPartition: string = toBytes32("0xa1");
    const testFrom: string = createAddress("0xb2");
    const testTo: string = createAddress("0xc3");

    const testOperator: string = createAddress("0xd4");
    const bytesOperatorData: string = toBytes32("0xe5");
    const testValue: BigNumber = BigNumber.from(200).mul(AMOUNT_CORRECTION);

    const testData: string = "0x1234"; // anything shorter than 128 

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
      inputs: [testFromPartition],
      outputs: [true],
    });

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(75)
      .addAnonymousEventLog(testAmp, data, ...topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding([
        testValue.toString(),
        testFromPartition,
        testOperator,
        testFrom,
        testFromPartition,
        testTo,
        bytesOperatorData
      ])
    ]);
  });
});
