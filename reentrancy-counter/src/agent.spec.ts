import { Finding, HandleBlock, HandleTransaction } from "forta-agent";
import { TestTransactionEvent, TestBlockEvent, MockEthersProvider } from "forta-agent-tools/lib/test";
import agent, { thresholds } from "./agent";
import { Counter, createFinding, reentrancyLevel } from "./agent.utils";

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

  // it("Orion Test", async () => {
  //   const tx: TestTransactionEvent = new TestTransactionEvent().addTraces(
  //     // { to: "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852", traceAddress: [9] },
  //     // { to: "0xdac17f958d2ee523a2206206994597c13d831ec7", traceAddress: [9,0] },
  //     // { to: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", traceAddress: [9,1,0] },
  //     // { to: "0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf", traceAddress: [9,1,0,0] },
  //     { to: "0xb5599f568d3f3e6113b286d010d2bca40a7745aa", traceAddress: [9,1,1] }, // victim
  //     { to: "0x98a877bb507f19eb43130b688f522a13885cf604", traceAddress: [9,1,1,0] },
  //     { to: "0x79f774095a33071f6172ab0832ed20adb44df992", traceAddress: [9,1,1,0,0] },
  //     { to: "0x420a50a62b17c18b36c64478784536ba980feac8", traceAddress: [9,1,1,0,0,0] },
  //     { to: "0x420a50a62b17c18b36c64478784536ba980feac8", traceAddress: [9,1,1,0,0,1] },
  //     { to: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", traceAddress: [9,1,1,0,0,1,0] },
  //     { to: "0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf", traceAddress: [9,1,1,0,0,1,0,0] },
  //     { to: "0xdac17f958d2ee523a2206206994597c13d831ec7", traceAddress: [9,1,1,0,0,1,1] },
  //     { to: "0x5fa0060fcfea35b31f7a5f6025f0ff399b98edf1", traceAddress: [9,1,1,0,0,1,2] },
  //     { to: "0x76fe189e4fa5ff997872ddf44023b04cd7cb03d2", traceAddress: [9,1,1,0,0,1,3] },
  //     { to: "0x5fa0060fcfea35b31f7a5f6025f0ff399b98edf1", traceAddress: [9,1,1,0,0,1,4] },
  //     { to: "0x13e557c51c0a37e25e051491037ee546597c689f", traceAddress: [9,1,1,0,0,1,5] },
  //     { to: "0x5fa0060fcfea35b31f7a5f6025f0ff399b98edf1", traceAddress: [9,1,1,0,0,1,6] },
  //     { to: "0xb5599f568d3f3e6113b286d010d2bca40a7745aa", traceAddress: [9,1,1,0,0,1,7] }, // victim
  //     { to: "0x98a877bb507f19eb43130b688f522a13885cf604", traceAddress: [9,1,1,0,0,1,7,0] },
  //     { to: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", traceAddress: [9,1,1,0,0,1,7,0,0] },
  //     { to: "0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf", traceAddress: [9,1,1,0,0,1,7,0,0,0] },
  //     { to: "0xdac17f958d2ee523a2206206994597c13d831ec7", traceAddress: [9,1,1,0,0,1,8] },
  //     { to: "0x5fa0060fcfea35b31f7a5f6025f0ff399b98edf1", traceAddress: [9,1,1,0,0,1,9] },
  //     { to: "0x5fa0060fcfea35b31f7a5f6025f0ff399b98edf1", traceAddress: [9,1,1,0,0,1,10] },
  //     { to: "0x76fe189e4fa5ff997872ddf44023b04cd7cb03d2", traceAddress: [9,1,1,0,0,1,11] },
  //     { to: "0x64acd987a8603eeaf1ee8e87addd512908599aec", traceAddress: [9,1,1,0,0,1,11,0] },
  //     { to: "0xdac17f958d2ee523a2206206994597c13d831ec7", traceAddress: [9,1,1,0,0,1,11,0,0,0] },
  //     { to: "0xb5599f568d3f3e6113b286d010d2bca40a7745aa", traceAddress: [9,1,1,0,0,1,11,0,0,1] }, // victim
  //     { to: "0x98a877bb507f19eb43130b688f522a13885cf604", traceAddress: [9,1,1,0,0,1,11,0,0,1,0] },
  //     { to: "0xdac17f958d2ee523a2206206994597c13d831ec7", traceAddress: [9,1,1,0,0,1,11,0,0,1,0,0] },
  //     { to: "0xdac17f958d2ee523a2206206994597c13d831ec7", traceAddress: [9,1,1,0,0,1,11,0,0,1,0,1] },
  //     { to: "0xdac17f958d2ee523a2206206994597c13d831ec7", traceAddress: [9,1,1,0,0,1,11,0,0,1,0,2] },
  //     { to: "0xdac17f958d2ee523a2206206994597c13d831ec7", traceAddress: [9,1,1,0,0,1,11,0,0,1,0,3] },
  //     { to: "0x000000000000000000636f6e736f6c652e6c6f67", traceAddress: [9,1,1,0,0,1,11,0,1] },
  //     { to: "0x64acd987a8603eeaf1ee8e87addd512908599aec", traceAddress: [9,1,1,0,0,1,11,1] },
  //     { to: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", traceAddress: [9,1,1,0,0,1,11,2] },
  //     { to: "0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf", traceAddress: [9,1,1,0,0,1,11,2,0] },
  //     { to: "0x5fa0060fcfea35b31f7a5f6025f0ff399b98edf1", traceAddress: [9,1,1,0,0,1,12] },
  //     { to: "0x13e557c51c0a37e25e051491037ee546597c689f", traceAddress: [9,1,1,0,0,1,13] },
  //     { to: "0xdac17f958d2ee523a2206206994597c13d831ec7", traceAddress: [9,1,1,0,0,1,13,0] },
  //     { to: "0x64acd987a8603eeaf1ee8e87addd512908599aec", traceAddress: [9,1,1,0,0,1,13,1] },
  //     { to: "0xdac17f958d2ee523a2206206994597c13d831ec7", traceAddress: [9,1,1,0,0,1,13,2] },
  //     { to: "0xdac17f958d2ee523a2206206994597c13d831ec7", traceAddress: [9,1,1,0,0,1,14] },
  //     { to: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", traceAddress: [9,1,1,0,0,1,15] },
  //     { to: "0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf", traceAddress: [9,1,1,0,0,1,15,0] },
  //     { to: "0xdac17f958d2ee523a2206206994597c13d831ec7", traceAddress: [9,1,1,0,0,1,16] },
  //     { to: "0xdac17f958d2ee523a2206206994597c13d831ec7", traceAddress: [9,1,2] },
  //     { to: "0xb5599f568d3f3e6113b286d010d2bca40a7745aa", traceAddress: [9,1,3] }, // victim
  //     { to: "0x98a877bb507f19eb43130b688f522a13885cf604", traceAddress: [9,1,3,0] },
  //     { to: "0xdac17f958d2ee523a2206206994597c13d831ec7", traceAddress: [9,1,4] },
  //     { to: "0xdac17f958d2ee523a2206206994597c13d831ec7", traceAddress: [9,1,5] },
  //     { to: "0xb5599f568d3f3e6113b286d010d2bca40a7745aa", traceAddress: [9,1,6] }, // victim
  //     { to: "0x98a877bb507f19eb43130b688f522a13885cf604", traceAddress: [9,1,6,0] },
  //     { to: "0xdac17f958d2ee523a2206206994597c13d831ec7", traceAddress: [9,1,6,0,0] },
  //     { to: "0xdac17f958d2ee523a2206206994597c13d831ec7", traceAddress: [9,1,6,0,1] },
  //     { to: "0xdac17f958d2ee523a2206206994597c13d831ec7", traceAddress: [9,1,7] },
  //     { to: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", traceAddress: [9,2] },
  //     { to: "0xdac17f958d2ee523a2206206994597c13d831ec7", traceAddress: [9,3] },
  //   );
  //   const findings: Finding[] = await handleTransaction(tx);
  //   expect(findings).toStrictEqual([]);
  // });

  it("Should ignore multiple calls from same address with different first level calls", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent().addTraces(
      { to: "0x0", traceAddress: []},
      { to: "0x1", traceAddress: [0] },
      { to: "0x1", traceAddress: [1] },
      { to: "0x2", traceAddress: [2] },
      { to: "0x1", traceAddress: [2, 0] }
    );
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([]);
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
        createFinding("0x0", 3, severity0x0, mockAnomalyScore, 0.3, JSON.stringify(traceAddresses), "0x2222", "0x9876")
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
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
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
        { to: "0x4", traceAddress: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      );
    const [report0x1, severity0x1] = reentrancyLevel(1, thresholds);
    const [report0x2, severity0x2] = reentrancyLevel(3, thresholds);
    const [report0x4, severity0x4] = reentrancyLevel(5, thresholds);
    const expected: Finding[] = [];
    if (report0x1) expected.push(createFinding("0x1", 1, severity0x1, 0.0, 0, "", "0x2222", "0x9876")); //Anomaly Score is 0.0, because Severity needs not to be "Unknown", in order for the "report" to be true and anomaly score to be calculated
    if (report0x2) {
      const mockAnomalyScore = (mockReentrantCalls.Info + 1) / (mockTotalTxsWithTraces + 1);
      expected.push(
        createFinding(
          "0x2",
          3,
          severity0x2,
          mockAnomalyScore,
          0.3,
          JSON.stringify(traceAddresses["0x2"]),
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
          JSON.stringify(traceAddresses["0x4"]),
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
