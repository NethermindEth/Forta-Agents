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
const AMP_TOKEN = createAddress("0xdef1");
const FLEXA_TOKEN = createAddress("0xf1e4a");
const AMOUNT_THRESHOLD: BigNumber = BigNumber.from(100);
const AMP_IFACE: Interface = new Interface(abi.AMP_TOKEN);
const FLEXA_IFACE: Interface = new Interface(abi.FLEXA_TOKEN);
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
      AMOUNT_THRESHOLD,
      AMP_TOKEN,
      FLEXA_TOKEN,
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
    const testFrom: string = createAddress("0xabc1");
    const testTo: string = createAddress("0xabc2");

    const testOperator: string = createAddress(("0xe0a"));
    const bytesOperatorData: string = toBytes32("0x0123");
    const testValue: number = 100;

    const testDestinationPartition: string =
      "0xcccccccc7a0208a97d8ac263706d7f8b3445d8dfc790c524e3990ef014e7c578";
    const testData: string = encodeParameters(
      ["bytes32", "bytes32"],
      [testFlag, testDestinationPartition]
    );

    const { data, topics } = AMP_IFACE.encodeEventLog(
      AMP_IFACE.getEvent("TransferByPartition"),
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
      .addEventLog(badWorkSig, AMP_TOKEN, data, ...topics.slice(1));

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should returns  findings if value is lesser than threshold", async () => {
    const testFromPartition: string =
      "0xcccccccc2862b8cb21caedb8706d7f8b3445d8dfc790c524e3990ef014e7c578";
    const testFrom: string = createAddress("0xabc1");
    const testTo: string = createAddress("0xabc2");

    const testOperator: string = createAddress("0xe0a");
    const bytesOperatorData: string = toBytes32("0x0123");
    const testValue: number = 10;

    const testDestinationPartition: string =
      "0xcccccccc7a0208a97d8ac263706d7f8b3445d8dfc790c524e3990ef014e7c578";
    const testData: string = encodeParameters(
      ["bytes32", "bytes32"],
      [testFlag, testDestinationPartition]
    );

    const { data, topics } = AMP_IFACE.encodeEventLog(
      AMP_IFACE.getEvent("TransferByPartition"),
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
    mockProvider.addCallTo(FLEXA_TOKEN, 50, FLEXA_IFACE, "partitions", {
      inputs: [testDestinationPartition],
      outputs: [true],
    });

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(50)
      .addAnonymousEventLog(AMP_TOKEN, data, ...topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
  it("should returns  findings if value is equal to threshold", async () => {
    const testFromPartition: string =
      "0xcccccccc2862b8cb21caedb8706d7f8b3445d8dfc790c524e3990ef014e7c578";
    const testFrom: string = createAddress("0xabc1");
    const testTo: string = createAddress("0xabc2");

    const testOperator: string = createAddress("0xe0a");
    const bytesOperatorData: string = toBytes32("0x0123");
    const testValue: any = AMOUNT_THRESHOLD;

    const testDestinationPartition: string =
      "0xcccccccc7a0208a97d8ac263706d7f8b3445d8dfc790c524e3990ef014e7c578";
    const testData: string = encodeParameters(
      ["bytes32", "bytes32"],
      [testFlag, testDestinationPartition]
    );

    const { data, topics } = AMP_IFACE.encodeEventLog(
      AMP_IFACE.getEvent("TransferByPartition"),
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
    mockProvider.addCallTo(FLEXA_TOKEN, 50, FLEXA_IFACE, "partitions", {
      inputs: [testDestinationPartition],
      outputs: [true],
    });

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(50)
      .addAnonymousEventLog(AMP_TOKEN, data, ...topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(
        AMOUNT_THRESHOLD,
        testValue,
        testFromPartition,
        testOperator,
        testFrom,
        testDestinationPartition,
        testTo
      ),
    ]);
  });

  it("should returns  findings if value is greater than threshold", async () => {
    const testFromPartition: string =
      "0xcccccccc2862b8cb21caedb8706d7f8b3445d8dfc790c524e3990ef014e7c578";
    const testFrom: string = createAddress("0xabc1");
    const testTo: string = createAddress("0xabc2");

    const testOperator: string = createAddress("0xe0a");
    const bytesOperatorData: string = toBytes32("0x0123");
    const testValue: number = 10000000;

    const testDestinationPartition: string =
      "0xcccccccc7a0208a97d8ac263706d7f8b3445d8dfc790c524e3990ef014e7c578";
    const testData: string = encodeParameters(
      ["bytes32", "bytes32"],
      [testFlag, testDestinationPartition]
    );

    const { data, topics } = AMP_IFACE.encodeEventLog(
      AMP_IFACE.getEvent("TransferByPartition"),
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
    mockProvider.addCallTo(FLEXA_TOKEN, 50, FLEXA_IFACE, "partitions", {
      inputs: [testDestinationPartition],
      outputs: [true],
    });

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(50)
      .addAnonymousEventLog(AMP_TOKEN, data, ...topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(
        AMOUNT_THRESHOLD,
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
      [
        AMOUNT_THRESHOLD,
        100,
        "0xcccccccc2862b8cb21caedb8706d7f8b3445d8dfc790c524e3990ef014e7c578",
        createAddress("0xe0a"),
        createAddress("0xabc1"),
        "0xcccccccc7a0208a97d8ac263706d7f8b3445d8dfc790c524e3990ef014e7c578",
        createAddress("0xabc1"),
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffcccccccc7a0208a97d8ac263706d7f8b3445d8dfc790c524e3990ef014e7c578",
        "0x0123"
      ],
      [
        AMOUNT_THRESHOLD,
        100,
        "0xcccccccc2862b8cb21caedb8706d7f8b3445d8dfc790c524e3990ef014e7c578",
        createAddress("0xe0a"),
        createAddress("0xabc1"),
        "0xcccccccc7a0208a97d8ac263706d7f8b3445d8dfc790c524e3990ef014e7c578",
        createAddress("0xabc1"),
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffcccccccc7a0208a97d8ac263706d7f8b3445d8dfc790c524e3990ef014e7c578",
        "0x0123"
      ],
      [
        AMOUNT_THRESHOLD,
        100,
        "0xcccccccc2862b8cb21caedb8706d7f8b3445d8dfc790c524e3990ef014e7c578",
        createAddress("0xe0a"),
        createAddress("0xabc1"),
        "0xcccccccc7a0208a97d8ac263706d7f8b3445d8dfc790c524e3990ef014e7c578",
        createAddress("0xabc1"),
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffcccccccc7a0208a97d8ac263706d7f8b3445d8dfc790c524e3990ef014e7c578",
        "0x0123"
      ]
    ];

    let txEvent: TransactionEvent = new TestTransactionEvent();
    for (let [
      amountThreshold,
      amount,
      partition,
      operator,
      from,
      destinationPartition,
      to,
      datas,
      operatorData,
    ] of CASES) {
      const { data, topics } = AMP_IFACE.encodeEventLog(
        AMP_IFACE.getEvent("TransferByPartition"),
        [partition, operator, from, to, amount, datas, operatorData]
      );
      txEvent = new TestTransactionEvent()
        .setBlock(50)
        .addAnonymousEventLog(AMP_TOKEN, data, ...topics);

      mockProvider.addCallTo(FLEXA_TOKEN, 50, FLEXA_IFACE, "partitions", {
        inputs: [destinationPartition],
        outputs: [true],
      });
    }

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
    ]);
  });

  it("should return findings when event is not emitted in the correct address", async () => {
    const wrongAmpToken: string = createAddress("0xabc2");

    const testFromPartition: string =
      "0xcccccccc2862b8cb21caedb8706d7f8b3445d8dfc790c524e3990ef014e7c578";
    const testFrom: string = createAddress("0xabc1");
    const testTo: string = createAddress("0xabc2");

    const testOperator: string = createAddress("0xe0a");
    const bytesOperatorData: string = toBytes32("0x0123");
    const testValue: number = 100;

    const testDestinationPartition: string =
      "0xcccccccc7a0208a97d8ac263706d7f8b3445d8dfc790c524e3990ef014e7c578";
    const testData: string = encodeParameters(
      ["bytes32", "bytes32"],
      [testFlag, testDestinationPartition]
    );

    const { data, topics } = AMP_IFACE.encodeEventLog(
      AMP_IFACE.getEvent("TransferByPartition"),
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
    mockProvider.addCallTo(FLEXA_TOKEN, 50, FLEXA_IFACE, "partitions", {
      inputs: [testDestinationPartition],
      outputs: [true],
    });

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(50)

      .addAnonymousEventLog(wrongAmpToken, data, ...topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
