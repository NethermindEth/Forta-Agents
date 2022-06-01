import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { TestTransactionEvent, createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import { provideHandleTransaction } from "./agent";
import NetworkData from "./network";
import { PAIR_IFACE, create2Pair } from "./utils";

const createFinding = (
  sender: string,
  amount0In: BigNumber,
  amount1In: BigNumber,
  amount0Out: BigNumber,
  amount1Out: BigNumber,
  to: string
) => {
  return Finding.fromObject({
    name: "Large Swap has occurred",
    description: "Swap event was emitted with a large amount",
    alertId: "TRADERJOE-03",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "TraderJoe",
    metadata: {
      sender,
      amount0In: amount0In.toString(),
      amount1In: amount1In.toString(),
      amount0Out: amount0Out.toString(),
      amount1Out: amount1Out.toString(),
      to,
    },
  });
};

const mockProvider: MockEthersProvider = new MockEthersProvider();
const mockNetworkManager: NetworkData = {
  factory: createAddress("0xaa112"),
  networkMap: {},
  setNetwork: jest.fn(),
};
const testThresholdPercentage: number = 10;
// Format: [token0, token1]
const testTokens: [string, string][] = [
  [createAddress("0xab321"), createAddress("0xac123")],
  [createAddress("0xab444"), createAddress("0xac777")],
  [createAddress("0xab456"), createAddress("0xac654")],
  [createAddress("0xab987"), createAddress("0xac789")],
  [createAddress("0xab852"), createAddress("0xac147")],
];
const testPairs: string[] = [
  create2Pair(testTokens[0][0], testTokens[0][1], mockNetworkManager.factory),
  create2Pair(testTokens[1][0], testTokens[1][1], mockNetworkManager.factory),
  create2Pair(testTokens[2][0], testTokens[2][1], mockNetworkManager.factory),
  create2Pair(testTokens[3][0], testTokens[3][1], mockNetworkManager.factory),
  create2Pair(testTokens[4][0], testTokens[4][1], mockNetworkManager.factory),
];
// Format: [sender, amount0In, amount1In, amount0Out, amount1Out, to]
const testCases: [string, BigNumber, BigNumber, BigNumber, BigNumber, string][] = [
  [
    createAddress("0xab123"),
    BigNumber.from("10"),
    BigNumber.from("25"),
    BigNumber.from("75"),
    BigNumber.from("325"), // Greater than 150 threshold
    createAddress("0xab321"),
  ],
  [
    createAddress("0xac456"),
    BigNumber.from("225"), // Greater than 200 threshold
    BigNumber.from("25"),
    BigNumber.from("75"),
    BigNumber.from("15"),
    createAddress("0xac789"),
  ],
  [
    createAddress("0xad654"),
    BigNumber.from("35"),
    BigNumber.from("25"),
    BigNumber.from("444"), // Greater than 300 threshold
    BigNumber.from("15"),
    createAddress("0xad987"),
  ],
  [
    createAddress("0xad654"),
    BigNumber.from("35"),
    BigNumber.from("600"), // Greater than 350 threshold
    BigNumber.from("45"),
    BigNumber.from("15"),
    createAddress("0xad987"),
  ],
  [
    createAddress("0xae741"),
    BigNumber.from("35"), // All lower than either
    BigNumber.from("25"), // 400 or 450 thresholds
    BigNumber.from("40"),
    BigNumber.from("15"),
    createAddress("0xae842"),
  ],
];
// Format: [reserve0, reserve1, blockTimestampLast]
const testReserves: [BigNumber, BigNumber, number][] = [
  [BigNumber.from("1000"), BigNumber.from("1500"), 456],
  [BigNumber.from("2000"), BigNumber.from("2500"), 891],
  [BigNumber.from("3000"), BigNumber.from("3500"), 765],
  [BigNumber.from("4000"), BigNumber.from("4500"), 852],
  [BigNumber.from("5000"), BigNumber.from("5000"), 753],
];
const testBlocks: number[] = [444, 3230, 90059, 90210, 230608];

describe("Large Swap test suite", () => {
  let handleTransaction: HandleTransaction = provideHandleTransaction(
    mockProvider as any,
    mockNetworkManager,
    testThresholdPercentage
  );

  const createToken0Call = (pairAddress: string, token0Address: string, blockNumber: number) => {
    mockProvider.addCallTo(pairAddress, blockNumber, PAIR_IFACE, "token0", {
      inputs: [],
      outputs: [token0Address],
    });
  };

  const createToken1Call = (pairAddress: string, token1Address: string, blockNumber: number) => {
    mockProvider.addCallTo(pairAddress, blockNumber, PAIR_IFACE, "token1", {
      inputs: [],
      outputs: [token1Address],
    });
  };

  const creategetReservesCall = (
    pairAddress: string,
    reserve0: BigNumber,
    reserve1: BigNumber,
    blockTimestampLast: number,
    blockNumber: number
  ) => {
    mockProvider.addCallTo(pairAddress, blockNumber, PAIR_IFACE, "getReserves", {
      inputs: [],
      outputs: [reserve0, reserve1, blockTimestampLast],
    });
  };

  beforeEach(() => {
    mockProvider.clear();
  });

  it("should return 0 findings in empty transactions", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should detect a large Swap event emission with `amount1Out` greater than threshold", async () => {
    const [reserve0, reserve1, blockTimestampLast] = testReserves[0];
    const [sender, amount0In, amount1In, amount0Out, amount1Out, to] = testCases[0];

    createToken0Call(testPairs[0], testTokens[0][0], testBlocks[0]);
    createToken1Call(testPairs[0], testTokens[0][1], testBlocks[0]);
    creategetReservesCall(testPairs[0], reserve0, reserve1, blockTimestampLast, testBlocks[0] - 1);

    const swapLog = PAIR_IFACE.encodeEventLog(PAIR_IFACE.getEvent("Swap"), [
      sender,
      amount0In,
      amount1In,
      amount0Out,
      amount1Out,
      to,
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(testPairs[0])
      .setFrom(sender)
      .setBlock(testBlocks[0])
      .addAnonymousEventLog(testPairs[0], swapLog.data, ...swapLog.topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([createFinding(sender, amount0In, amount1In, amount0Out, amount1Out, to)]);
  });

  it("should detect a large Swap event emission with `amount0In` greater than threshold", async () => {
    const [reserve0, reserve1, blockTimestampLast] = testReserves[1];
    const [sender, amount0In, amount1In, amount0Out, amount1Out, to] = testCases[1];

    createToken0Call(testPairs[1], testTokens[1][0], testBlocks[1]);
    createToken1Call(testPairs[1], testTokens[1][1], testBlocks[1]);
    creategetReservesCall(testPairs[1], reserve0, reserve1, blockTimestampLast, testBlocks[1] - 1);

    const swapLog = PAIR_IFACE.encodeEventLog(PAIR_IFACE.getEvent("Swap"), [
      sender,
      amount0In,
      amount1In,
      amount0Out,
      amount1Out,
      to,
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(testPairs[1])
      .setFrom(sender)
      .setBlock(testBlocks[1])
      .addAnonymousEventLog(testPairs[1], swapLog.data, ...swapLog.topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([createFinding(sender, amount0In, amount1In, amount0Out, amount1Out, to)]);
  });

  it("should detect multiple large Swap event emissions with `amount0Out` and `amount1In` greater than threshold", async () => {
    const [reserve0, reserve1, blockTimestampLast] = testReserves[2];

    const [senderOne, amount0InOne, amount1InOne, amount0OutOne, amount1OutOne, toOne] = testCases[2];
    const [senderTwo, amount0InTwo, amount1InTwo, amount0OutTwo, amount1OutTwo, toTwo] = testCases[3];

    createToken0Call(testPairs[1], testTokens[1][0], testBlocks[2]);
    createToken1Call(testPairs[1], testTokens[1][1], testBlocks[2]);
    creategetReservesCall(testPairs[1], reserve0, reserve1, blockTimestampLast, testBlocks[2] - 1);

    const swapLogOne = PAIR_IFACE.encodeEventLog(PAIR_IFACE.getEvent("Swap"), [
      senderOne,
      amount0InOne,
      amount1InOne,
      amount0OutOne,
      amount1OutOne,
      toOne,
    ]);

    const swapLogTwo = PAIR_IFACE.encodeEventLog(PAIR_IFACE.getEvent("Swap"), [
      senderTwo,
      amount0InTwo,
      amount1InTwo,
      amount0OutTwo,
      amount1OutTwo,
      toTwo,
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(testPairs[1])
      .setFrom(senderOne)
      .setBlock(testBlocks[2])
      .addAnonymousEventLog(testPairs[1], swapLogOne.data, ...swapLogOne.topics)
      .addAnonymousEventLog(testPairs[1], swapLogTwo.data, ...swapLogTwo.topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(senderOne, amount0InOne, amount1InOne, amount0OutOne, amount1OutOne, toOne),
      createFinding(senderTwo, amount0InTwo, amount1InTwo, amount0OutTwo, amount1OutTwo, toTwo),
    ]);
  });

  it("should not detect a Swap event emissions with all arguments less than threshold", async () => {
    const [reserve0, reserve1, blockTimestampLast] = testReserves[3];

    const [sender, amount0In, amount1In, amount0Out, amount1Out, to] = testCases[4];

    createToken0Call(testPairs[1], testTokens[1][0], testBlocks[3]);
    createToken1Call(testPairs[1], testTokens[1][1], testBlocks[3]);
    creategetReservesCall(testPairs[1], reserve0, reserve1, blockTimestampLast, testBlocks[3] - 1);

    const swapLog = PAIR_IFACE.encodeEventLog(PAIR_IFACE.getEvent("Swap"), [
      sender,
      amount0In,
      amount1In,
      amount0Out,
      amount1Out,
      to,
    ]);
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(testPairs[1])
      .setFrom(sender)
      .setBlock(testBlocks[3])
      .addAnonymousEventLog(testPairs[1], swapLog.data, ...swapLog.topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should not detect a different event emission from valid pair contract", async () => {
    const sender: string = createAddress("0xab123");

    const diffEventAbi: string = "event Diff()";
    const diffIFace: Interface = new Interface([diffEventAbi]);

    createToken0Call(testPairs[1], testTokens[1][0], testBlocks[4]);
    createToken1Call(testPairs[1], testTokens[1][1], testBlocks[4]);

    const diffLog = diffIFace.encodeEventLog(diffIFace.getEvent("Diff"), []);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(testPairs[1])
      .setFrom(sender)
      .setBlock(testBlocks[4])
      .addAnonymousEventLog(testPairs[1], diffLog.data, ...diffLog.topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should not detect a large Swap event emission from non-valid pair contract", async () => {
    const nonValidPair: string = createAddress("0xdead");

    const [sender, amount0In, amount1In, amount0Out, amount1Out, to] = testCases[1];

    createToken0Call(nonValidPair, testTokens[1][0], testBlocks[1]);
    createToken1Call(nonValidPair, testTokens[1][1], testBlocks[1]);

    const swapLog = PAIR_IFACE.encodeEventLog(PAIR_IFACE.getEvent("Swap"), [
      sender,
      amount0In,
      amount1In,
      amount0Out,
      amount1Out,
      to,
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(nonValidPair)
      .setFrom(sender)
      .setBlock(testBlocks[1])
      .addAnonymousEventLog(nonValidPair, swapLog.data, ...swapLog.topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
