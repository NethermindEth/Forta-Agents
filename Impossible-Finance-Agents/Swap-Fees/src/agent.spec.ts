import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import {
  createAddress,
  TestTransactionEvent,
  MockEthersProvider,
} from "forta-agent-tools/lib/tests";
import abi from "./abi";
import { provideHandleTransaction } from "./agent";
import PairFetcher from "./pairs.fetcher";

const tradeFeesFinding = (pair: string, oldFee: string, newFee: string): Finding =>
  Finding.fromObject({
    name: "Impossible Finance Pair fees Updated",
    description: "Trade fee updated",
    protocol: "Impossible Finance",
    alertId: "IMPOSSIBLE-6-1",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: { pair, oldFee, newFee },
  });

const withdrawalFeeRatioFinding = (
  pair: string,
  oldFee: string,
  newFee: string
): Finding =>
  Finding.fromObject({
    name: "Impossible Finance Pair fees Updated",
    description: "Withdrawal fee ratio updated",
    protocol: "Impossible Finance",
    alertId: "IMPOSSIBLE-6-2",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: { pair, oldFee, newFee },
  });

describe("Swap Fee Monitor agent tests suite", () => {
  const testFactory: string = createAddress("0xab123");
  const diffPair: string = createAddress("0xdead");
  // [token0, token1]
  const testTokens: string[][] = [
    [createAddress("0xab12"), createAddress("0xab34")],
    [createAddress("0xac21"), createAddress("0xac43")],
    [createAddress("0xad14"), createAddress("0xad32")],
    [createAddress("0xaf41"), createAddress("0xaf23")],
  ];
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockFetcher: PairFetcher = new PairFetcher(testFactory, mockProvider as any);
  const handler: HandleTransaction = provideHandleTransaction(mockFetcher as any);

  const createGetTokens = (
    pairContract: string,
    blockNumber: number,
    token0Addr: string,
    token1Addr: string
  ) => {
    mockProvider.addCallTo(pairContract, blockNumber, abi.PAIR, "token0", {
      inputs: [],
      outputs: [token0Addr],
    });
    mockProvider.addCallTo(pairContract, blockNumber, abi.PAIR, "token1", {
      inputs: [],
      outputs: [token1Addr],
    });
  };

  const createGetPair = (
    blockNumber: number,
    token0Addr: string,
    token1Addr: string,
    pairAddr: string
  ) => {
    mockProvider.addCallTo(testFactory, blockNumber, abi.FACTORY, "getPair", {
      inputs: [token0Addr, token1Addr],
      outputs: [pairAddr],
    });
  };

  beforeEach(() => mockProvider.clear());

  it("should report empty findings in txns without events", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect UpdatedTradeFees events only in valid Impossible Finance pairs", async () => {
    const PAIRS: string[] = [
      createAddress("0xdef1abc"),
      createAddress("0xdef1"),
      createAddress("0xdef121321"),
    ];

    createGetTokens(PAIRS[0], 20, testTokens[0][0], testTokens[0][1]);
    createGetTokens(PAIRS[1], 20, testTokens[1][0], testTokens[1][1]);
    createGetTokens(PAIRS[2], 20, testTokens[2][0], testTokens[2][1]);

    createGetPair(20, testTokens[0][0], testTokens[0][1], PAIRS[0]);
    createGetPair(20, testTokens[1][0], testTokens[1][1], diffPair);
    createGetPair(20, testTokens[2][0], testTokens[2][1], PAIRS[2]);

    const { data, topics } = abi.PAIR.encodeEventLog(
      abi.PAIR.getEvent("UpdatedTradeFees"),
      [20, 50]
    );
    const tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(20)
      .addAnonymousEventLog(PAIRS[1], data, ...topics)
      .addAnonymousEventLog(PAIRS[0], data, ...topics)
      .addAnonymousEventLog(PAIRS[2], data, ...topics);

    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([
      tradeFeesFinding(PAIRS[0], "20", "50"),
      tradeFeesFinding(PAIRS[2], "20", "50"),
    ]);
  });

  it("should detect UpdatedWithdrawalFeeRatio events only in valid Impossible Finance pairs", async () => {
    const PAIRS: string[] = [
      createAddress("0xda0fdc"),
      createAddress("0xda0efb"),
      createAddress("0xda0321"),
    ];

    createGetTokens(PAIRS[0], 42, testTokens[0][0], testTokens[0][1]);
    createGetTokens(PAIRS[1], 42, testTokens[1][0], testTokens[1][1]);
    createGetTokens(PAIRS[2], 42, testTokens[2][0], testTokens[2][1]);

    createGetPair(42, testTokens[0][0], testTokens[0][1], diffPair);
    createGetPair(42, testTokens[1][0], testTokens[1][1], PAIRS[1]);
    createGetPair(42, testTokens[2][0], testTokens[2][1], PAIRS[2]);

    const { data, topics } = abi.PAIR.encodeEventLog(
      abi.PAIR.getEvent("UpdatedWithdrawalFeeRatio"),
      [1, 2]
    );
    const tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(42)
      .addAnonymousEventLog(PAIRS[2], data, ...topics)
      .addAnonymousEventLog(PAIRS[1], data, ...topics)
      .addAnonymousEventLog(PAIRS[0], data, ...topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      withdrawalFeeRatioFinding(PAIRS[2], "1", "2"),
      withdrawalFeeRatioFinding(PAIRS[1], "1", "2"),
    ]);
  });

  it("should detect multiple type of events only in valid Impossible Finance pairs", async () => {
    const diffPairTwo: string = createAddress("0xbeef");

    const PAIRS: string[] = [
      createAddress("0xda0fdc"),
      createAddress("0xbade0a"),
      createAddress("0xdead"),
      createAddress("0x1337"),
    ];

    createGetTokens(PAIRS[0], 2000, testTokens[0][0], testTokens[0][1]);
    createGetTokens(PAIRS[1], 2000, testTokens[1][0], testTokens[1][1]);
    createGetTokens(PAIRS[2], 2000, testTokens[2][0], testTokens[2][1]);
    createGetTokens(PAIRS[3], 2000, testTokens[3][0], testTokens[3][1]);

    createGetPair(2000, testTokens[0][0], testTokens[0][1], PAIRS[0]);
    createGetPair(2000, testTokens[1][0], testTokens[1][1], diffPair);
    createGetPair(2000, testTokens[2][0], testTokens[2][1], diffPairTwo);
    createGetPair(2000, testTokens[3][0], testTokens[3][1], PAIRS[3]);

    const event0 = abi.PAIR.encodeEventLog(
      abi.PAIR.getEvent("UpdatedWithdrawalFeeRatio"),
      [200, 3]
    );
    const event1 = abi.PAIR.encodeEventLog(
      abi.PAIR.getEvent("UpdatedTradeFees"),
      [4040, 50]
    );
    const tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(2000)
      .addAnonymousEventLog(PAIRS[2], event1.data, ...event1.topics)
      .addAnonymousEventLog(PAIRS[1], event1.data, ...event1.topics)
      .addAnonymousEventLog(PAIRS[2], event0.data, ...event0.topics)
      .addAnonymousEventLog(PAIRS[3], event1.data, ...event1.topics)
      .addAnonymousEventLog(PAIRS[1], event0.data, ...event0.topics)
      .addAnonymousEventLog(PAIRS[0], event0.data, ...event0.topics)
      .addAnonymousEventLog(PAIRS[0], event1.data, ...event1.topics)
      .addAnonymousEventLog(PAIRS[3], event1.data, ...event1.topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      tradeFeesFinding(PAIRS[3], "4040", "50"),
      withdrawalFeeRatioFinding(PAIRS[0], "200", "3"),
      tradeFeesFinding(PAIRS[0], "4040", "50"),
      tradeFeesFinding(PAIRS[3], "4040", "50"),
    ]);
  });
});
