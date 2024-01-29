import { Finding, HandleBlock, HandleTransaction } from "forta-agent";
import { TestTransactionEvent, TestBlockEvent, MockEthersProvider } from "forta-agent-tools/lib/test";
import agent, { thresholds } from "./agent";
import { Counter, createFinding, reentrancyLevel, processReentrancyTraces } from "./agent.utils";

const mockPersistenceHelper = {
  persist: jest.fn(),
  load: jest.fn(),
};

const mockReentrantCallsKey: string = "nm-reentrancy-counter-reentranct-calls-per-threshold-mock-key";
const mockTotalTxsWithTracesKey: string = "nm-reentrancy-counter-total-txs-with-traces-mock-key";

const mockReentrantCalls: Counter = {
  Info: 21,
  Low: 33,
  Medium: 41,
  High: 2,
  Critical: 1,
};
const mockTotalTxsWithTraces = 645;

describe("Reentrancy counter agent tests suit", () => {
  let initialize;
  const mockProvider = new MockEthersProvider();
  const handleTransaction: HandleTransaction = agent.handleTransaction;

  beforeEach(async () => {
    initialize = agent.provideInitialize(
      mockProvider as any,
      mockPersistenceHelper as any,
      mockReentrantCallsKey,
      mockTotalTxsWithTracesKey
    );
    mockProvider.setNetwork(1);
    mockPersistenceHelper.load.mockReturnValueOnce(mockTotalTxsWithTraces).mockReturnValueOnce(mockReentrantCalls);
    await initialize();
  });

  it("Should return empty findings if no traces provided", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent();
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([]);
  });

  it("Should return empty findings if no repetition detected", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent().addTraces(
      { to: "0x0", traceAddress: [] },
      { to: "0x1", traceAddress: [0] },
      { to: "0x2", traceAddress: [0, 0] },
      { to: "0x3", traceAddress: [0, 0, 0] }
    );
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([]);
  });

  it("Should ignore non reentrant calls", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent().addTraces(
      { to: "0x0", traceAddress: [] },
      { to: "0x1", traceAddress: [0] },
      { to: "0x1", traceAddress: [1] },
      { to: "0x2", traceAddress: [1, 0] },
      { to: "0x2", traceAddress: [1, 1] },
      { to: "0x2", traceAddress: [1, 2] },
      { to: "0x2", traceAddress: [1, 3] },
      { to: "0x1", traceAddress: [2] },
      { to: "0x1", traceAddress: [3] },
      { to: "0x2", traceAddress: [4] },
      { to: "0x2", traceAddress: [5] },
      { to: "0x1", traceAddress: [6] },
      { to: "0x1", traceAddress: [7] }
    );
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([]);
  });

  it("Should ignore multiple calls from same address with different first level calls", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent().addTraces(
      { to: "0x0", traceAddress: [] },
      { to: "0x1", traceAddress: [0] },
      { to: "0x1", traceAddress: [1] },
      { to: "0x2", traceAddress: [2] },
      { to: "0x1", traceAddress: [2, 0] }
    );
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([]);
  });

  it("Should ignore psuedo-reentries that don't stem from the same root call path", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent().addTraces(
      { to: "0x0", traceAddress: [] },
      { to: "0x1", traceAddress: [0] },
      { to: "0x2", traceAddress: [0, 0] },
      { to: "0x2", traceAddress: [1] },
      { to: "0x1", traceAddress: [1, 0] },
      { to: "0x1", traceAddress: [1, 0, 0] },
      { to: "0x1", traceAddress: [1, 1] },
      { to: "0x2", traceAddress: [1, 1, 0] },
      { to: "0x1", traceAddress: [1, 1, 0, 0] }
    );
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([]);
  });

  it("Should return correct findings for nested call path splits", async () => {
    const traceAddresses = [
      [1, 0],
      [1, 0, 0],
      [1, 0, 2],
    ];
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setHash("0x2222")
      .setFrom("0x9876")
      .addTraces(
        { to: "0x0", traceAddress: [] },
        { to: "0x1", traceAddress: [0] },
        { to: "0x2", traceAddress: [0, 0] },
        { to: "0x2", traceAddress: [1] },
        { to: "0x1", traceAddress: [1, 0] },
        { to: "0x1", traceAddress: [1, 0, 0] },
        { to: "0x3", traceAddress: [1, 0, 1] },
        { to: "0x1", traceAddress: [1, 0, 2] },
        { to: "0x1", traceAddress: [1, 1] },
        { to: "0x2", traceAddress: [1, 1, 0] },
        { to: "0x1", traceAddress: [1, 1, 0, 0] }
      );
    const [report0x1, severity0x1] = reentrancyLevel(3, thresholds);
    const expected: Finding[] = [];
    if (report0x1) {
      const mockAnomalyScore = (mockReentrantCalls.Info + 1) / (mockTotalTxsWithTraces + 1);
      expected.push(
        createFinding("0x1", 3, severity0x1, mockAnomalyScore, 0.3, processReentrancyTraces(traceAddresses), "0x2222", "0x9876")
      );
    }
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual(expected);
    expect(findings.length).toEqual(expected.length);
  });

  it("Should return correct findings for paths with same reentrancy count but different max trace path lengths", async () => {
    const traceAddresses = [
      [1],
      [1, 1],
      [1, 1, 0, 0, 1]
    ];
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setHash("0x2222")
      .setFrom("0x9876")
      .addTraces(
        { to: "0x0", traceAddress: [] },
        { to: "0x1", traceAddress: [0] },
        { to: "0x1", traceAddress: [0, 0] },
        { to: "0x1", traceAddress: [0, 1] },
        { to: "0x1", traceAddress: [1] },
        { to: "0x1", traceAddress: [1, 1] },
        { to: "0x2", traceAddress: [1, 1, 0] },
        { to: "0x2", traceAddress: [1, 1, 0, 0] },
        { to: "0x1", traceAddress: [1, 1, 0, 0, 1] },
      );
    const [report0x1, severity0x1] = reentrancyLevel(3, thresholds);
    const expected: Finding[] = [];
    if (report0x1) {
      const mockAnomalyScore = (mockReentrantCalls.Info + 1) / (mockTotalTxsWithTraces + 1);
      expected.push(
        createFinding("0x1", 3, severity0x1, mockAnomalyScore, 0.3, processReentrancyTraces(traceAddresses), "0x2222", "0x9876")
      );
    }
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual(expected);
    expect(findings.length).toEqual(expected.length);
  });

  it("Should detect reentrancy with address called from top level", async () => {
    const traceAddresses = [[], [0], [0, 0]];
    // 0x0 called 3 times
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setHash("0x2222")
      .setFrom("0x9876")
      .addTraces(
        { to: "0x0", traceAddress: [] },
        { to: "0x0", traceAddress: [0] },
        { to: "0x0", traceAddress: [0, 0] }
      );
    const [report0x0, severity0x0] = reentrancyLevel(3, thresholds);
    const expected: Finding[] = [];
    if (report0x0) {
      const mockAnomalyScore = (mockReentrantCalls.Info + 1) / (mockTotalTxsWithTraces + 1);
      expected.push(
        createFinding("0x0", 3, severity0x0, mockAnomalyScore, 0.3, processReentrancyTraces(traceAddresses), "0x2222", "0x9876")
      );
    }
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual(expected);
    expect(findings.length).toEqual(expected.length);
  });

  it("Should detect different thresholds of reentrancy", async () => {
    const traceAddresses = {
      "0x2": [
        [0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ],
      "0x4": [
        [0, 1],
        [0, 1, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
    };
    // 0x0, 0x1, 0x3, 0x5, 0x6 called less than 3 times
    // 0x2 called 3 times
    // 0x4 called 5 times
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setHash("0x2222")
      .setFrom("0x9876")
      .addTraces(
        { to: "0x0", traceAddress: [] },
        { to: "0x1", traceAddress: [0] },
        { to: "0x2", traceAddress: [0, 0] },
        { to: "0x3", traceAddress: [0, 0, 0] },
        { to: "0x2", traceAddress: [0, 0, 0, 0] },
        { to: "0x3", traceAddress: [0, 0, 0, 0, 0] },
        { to: "0x2", traceAddress: [0, 0, 0, 0, 0, 0] },
        { to: "0x4", traceAddress: [0, 0, 0, 0, 0, 0, 0] },
        { to: "0x4", traceAddress: [0, 0, 0, 0, 0, 0, 0, 0] },
        { to: "0x4", traceAddress: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { to: "0x4", traceAddress: [0, 1] },
        { to: "0x5", traceAddress: [0, 1, 0] },
        { to: "0x6", traceAddress: [0, 1, 0, 0] },
        { to: "0x4", traceAddress: [0, 1, 0, 0, 0] },
        { to: "0x5", traceAddress: [0, 1, 0, 0, 0, 0] },
        { to: "0x4", traceAddress: [0, 1, 0, 0, 0, 0, 0] },
        { to: "0x6", traceAddress: [0, 1, 0, 0, 0, 0, 0, 0] },
        { to: "0x4", traceAddress: [0, 1, 0, 0, 0, 0, 0, 0, 0] },
        { to: "0x1", traceAddress: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0] },
        { to: "0x4", traceAddress: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
      );
    const [report0x1, severity0x1] = reentrancyLevel(1, thresholds);
    const [report0x2, severity0x2] = reentrancyLevel(3, thresholds);
    const [report0x4, severity0x4] = reentrancyLevel(5, thresholds);
    const expected: Finding[] = [];
    if (report0x1) expected.push(createFinding("0x1", 1, severity0x1, 0.0, 0, {}, "0x2222", "0x9876")); //Anomaly Score is 0.0, because Severity needs not to be "Unknown", in order for the "report" to be true and anomaly score to be calculated
    if (report0x2) {
      const mockAnomalyScore = (mockReentrantCalls.Info + 1) / (mockTotalTxsWithTraces + 1);
      expected.push(
        createFinding(
          "0x2",
          3,
          severity0x2,
          mockAnomalyScore,
          0.3,
          processReentrancyTraces(traceAddresses["0x2"]),
          "0x2222",
          "0x9876"
        )
      );
    }
    if (report0x4) {
      const mockAnomalyScore = (mockReentrantCalls.Low + 1) / (mockTotalTxsWithTraces + 1);
      expected.push(
        createFinding(
          "0x4",
          5,
          severity0x4,
          mockAnomalyScore,
          0.4,
          processReentrancyTraces(traceAddresses["0x4"]),
          "0x2222",
          "0x9876"
        )
      );
    }

    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toEqual(expect.arrayContaining(expected));
    expect(findings.length).toEqual(expected.length);
  });
});

describe("Block handler test suite", () => {
  let initialize;
  let handleBlock: HandleBlock;
  const mockProvider = new MockEthersProvider();

  beforeEach(async () => {
    initialize = agent.provideInitialize(
      mockProvider as any,
      mockPersistenceHelper as any,
      mockReentrantCallsKey,
      mockTotalTxsWithTracesKey
    );
    mockProvider.setNetwork(1);
    mockPersistenceHelper.load.mockReturnValueOnce(mockTotalTxsWithTraces).mockReturnValueOnce(mockReentrantCalls);
    await initialize();
    handleBlock = agent.provideHandleBlock(
      mockPersistenceHelper as any,
      mockReentrantCallsKey,
      mockTotalTxsWithTracesKey
    );
  });

  afterEach(async () => {
    mockPersistenceHelper.persist.mockClear();
  });

  it("should persist the value in a block evenly divisible by 240", async () => {
    const mockBlockEvent: TestBlockEvent = new TestBlockEvent().setNumber(720);

    await handleBlock(mockBlockEvent);

    expect(mockPersistenceHelper.persist).toHaveBeenCalledTimes(2);
  });

  it("should not persist values because block is not evenly divisible by 240", async () => {
    const mockBlockEvent: TestBlockEvent = new TestBlockEvent().setNumber(600);

    await handleBlock(mockBlockEvent);

    expect(mockPersistenceHelper.persist).toHaveBeenCalledTimes(0);
  });
});
