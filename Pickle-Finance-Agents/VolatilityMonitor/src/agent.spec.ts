import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools";
import { resetAllWhenMocks, when } from "jest-when";
import { provideHandleTransaction } from "./agent";
import { EventFragment, Interface } from "@ethersproject/abi";
import abi from "./abi";
import utils from "./utils";
import { BigNumber } from "ethers";


const IDS: number[] = [ 10, 42 ];
const KEEPERS: string[] = [
  createAddress("0xda01"),
  createAddress("0xda02"),
]
const STRATEGIES: string[][] = [
  [createAddress("0xd071"), createAddress("0xe0a")],
  [createAddress("0xd1a")],
]
const REGISTRY_IFACE: Interface = new Interface(abi.REGISTRY);
const PERFORM_EVENT: EventFragment = REGISTRY_IFACE.getEvent("UpkeepPerformed");
const KEEPER_IFACE: Interface = new Interface(abi.KEEPER);


const multipleCallsFinding = (
  index: number,
  strategyIndex: number,
  count: number,
  frame: number,
  severity: FindingSeverity,
): Finding => Finding.fromObject({
  name: "Pickle Volatility Monitor",
  description: "Many performUpkeep calls",
  alertId: "pickle-vm-1",
  type: FindingType.Info,
  severity,
  protocol: "Pickle Finance",
  metadata: {
    keeperId: IDS[index].toString(),
    keeperAddress: KEEPERS[index],
    strategyAddress: STRATEGIES[index][strategyIndex],
    timeSinceLastUpkeep: "0",
    numberOfUpkeepsToday: count.toString(),
    timeFrame: frame.toString(),
  }
});

const noCallsFinding = (
  index: number,
  strategyIndex: number,
  last: number,
  frame: number,
): Finding => Finding.fromObject({
  name: "Pickle Volatility Monitor",
  description: "Missing performUpkeep calls",
  alertId: "pickle-vm-2",
  type: FindingType.Info,
  severity: FindingSeverity.Medium,
  protocol: "Pickle Finance",
  metadata: {
    keeperId: IDS[index].toString(),
    keeperAddress: KEEPERS[index],
    strategyAddress: STRATEGIES[index][strategyIndex],
    timeSinceLastUpkeep: last.toString(),
    numberOfUpkeepsToday: "0",
    timeFrame: frame.toString(),
  }
});


describe("VM agent tests suite", () => {
  const registry: string = createAddress("0xdead");
  const mockFetcher = {
    registry,
    getUpkeep: jest.fn(),
    getStrategies: jest.fn(),
  }
  const mockMemory = {
    update: jest.fn(),
    getLast: jest.fn(),
    addStrategy: jest.fn(),
    removeStrategy: jest.fn(),
    getCount: jest.fn(),
  };

  const expectedCalls = (mock: any, amount: number, ...params: any[]) => {
    expect(mock).toHaveBeenCalledTimes(amount);
    for(let i = 1; i <= amount; ++i){
      expect(mock).nthCalledWith(i, ...params);
    }
  }

  const prepareBlock = (block: number, length: number=IDS.length) => {
    for(let i = 0; i < length; ++i){
      when(mockFetcher.getUpkeep)
        .calledWith(block, IDS[i])
        .mockReturnValue(KEEPERS[i]);
      when(mockFetcher.getUpkeep)
        .calledWith(block, BigNumber.from(IDS[i]))
        .mockReturnValue(KEEPERS[i]);
      when(mockFetcher.getStrategies)
        .calledWith(block, KEEPERS[i])
        .mockReturnValue(STRATEGIES[i].map(strat => strat));
    }
  };

  const performParams = (id: number, addr: string) => [
    id, 
    // random params unused in the agent ---
    true, createAddress("0xdead"), 1,
    // -------------------------------------
    utils.encodePerformData(createAddress(addr)),
  ];

  beforeEach(() => {
    resetAllWhenMocks();
    mockMemory.update.mockClear();
    mockMemory.getLast.mockClear();
    mockMemory.addStrategy.mockClear();
    mockMemory.removeStrategy.mockClear();
    mockMemory.getCount.mockClear();
  });

  it("should return empty findings in the there is nothing to report", async () => {
    prepareBlock(15);
    mockMemory.getLast.mockReturnValue(1);
    const handler: HandleTransaction = provideHandleTransaction(
      IDS, mockFetcher as any, mockMemory as any, 2, 3, 4,
    );

    const tx: TransactionEvent = new TestTransactionEvent().setBlock(15).setTimestamp(1);
    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should report short & medium period findings without flood", async () => {
    const handler: HandleTransaction = provideHandleTransaction(
      IDS, mockFetcher as any, mockMemory as any, 2, 4, 5,
    );
    
    prepareBlock(1);
    const timestamp: number = 1;
    mockMemory.getLast.mockReturnValue(8);
    mockMemory.update.mockReturnValue(1);
    mockMemory.getCount.mockReturnValue(10);
    
    const {data, topics} = REGISTRY_IFACE.encodeEventLog(
      PERFORM_EVENT, performParams(IDS[1], STRATEGIES[1][0]),
    )
    let tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(1)
      .setTimestamp(timestamp)
      .addAnonymousEventLog(registry, data, ...topics)
      // Duplicated call to generate flood
      .addAnonymousEventLog(registry, data, ...topics);
    let findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      multipleCallsFinding(1, 0, 10, 2, FindingSeverity.High),
      multipleCallsFinding(1, 0, 10, 4, FindingSeverity.Medium),
    ]);
    expectedCalls(
      mockMemory.getCount,
      4,
      KEEPERS[1],
      STRATEGIES[1][0],
    );
    expectedCalls(
      mockMemory.update,
      2,
      KEEPERS[1],
      STRATEGIES[1][0],
      timestamp,
    );    
  });

  it("should report medium period findings without flood", async () => {
    const handler: HandleTransaction = provideHandleTransaction(
      IDS, mockFetcher as any, mockMemory as any, 2, 5, 200,
    );
    
    prepareBlock(5);
    const timestamp: number = 100;
    mockMemory.getLast.mockReturnValue(50);
    mockMemory.update.mockReturnValue(3);
    mockMemory.getCount.mockReturnValue(10200);
    
    const {data, topics} = REGISTRY_IFACE.encodeEventLog(
      PERFORM_EVENT, performParams(IDS[0], STRATEGIES[0][1]),
    )
    let tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(5)
      .setTimestamp(timestamp)
      .addAnonymousEventLog(registry, data, ...topics)
      // Duplicated call to generate flood
      .addAnonymousEventLog(registry, data, ...topics);
    let findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      multipleCallsFinding(0, 1, 10200, 5, FindingSeverity.Medium),
    ]);
    expectedCalls(
      mockMemory.getCount,
      2,
      KEEPERS[0],
      STRATEGIES[0][1],
    );
    expectedCalls(
      mockMemory.update,
      2,
      KEEPERS[0],
      STRATEGIES[0][1],
      timestamp,
    );    
  });

  it("should report huge period findings without flood", async () => {
    const handler: HandleTransaction = provideHandleTransaction(
      IDS, mockFetcher as any, mockMemory as any, 50, 90, 100,
    );
    
    prepareBlock(4);
    when(mockMemory.getLast)
      .calledWith(KEEPERS[0], STRATEGIES[0][0])
      .mockReturnValue(200);
    when(mockMemory.getLast)
      .calledWith(KEEPERS[0], STRATEGIES[0][1])
      .mockReturnValue(900);
    when(mockMemory.getLast)
      .calledWith(KEEPERS[1], STRATEGIES[1][0])
      .mockReturnValue(901); // called on time

    let tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(4)
      .setTimestamp(1000)
    let findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      noCallsFinding(0, 0, 800, 100),
      noCallsFinding(0, 1, 100, 100),
    ]);

    // check than previous Findings will be not sent
    // during the same short frame
    prepareBlock(15);
    tx = new TestTransactionEvent()
      .setBlock(15)
      .setTimestamp(1020)
    findings = await handler(tx);
    expect(findings).toStrictEqual([
      noCallsFinding(1, 0, 119, 100),
    ]);

    // check than Findings are reported when flood time pass
    prepareBlock(42);
    when(mockMemory.getLast)
      .calledWith(KEEPERS[0], STRATEGIES[0][0])
      .mockReturnValue(1000);
    when(mockMemory.getLast)
      .calledWith(KEEPERS[1], STRATEGIES[1][0])
      .mockReturnValue(1000);

    tx = new TestTransactionEvent()
      .setBlock(42)
      .setTimestamp(1091)
    findings = await handler(tx);
    expect(findings).toStrictEqual([
      noCallsFinding(0, 1, 191, 100),
    ]);
  });

  it("should call add/remove strategy correctly", async () => {
    const handler: HandleTransaction = provideHandleTransaction(
      IDS, mockFetcher as any, mockMemory as any, 2, 4, 100,
    );
    
    prepareBlock(2022);
    mockMemory.getLast.mockReturnValue(180);

    let tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(2022)
      .setTimestamp(200)
      .addTraces({
        input: KEEPER_IFACE.encodeFunctionData(
          "addStrategy", 
          [STRATEGIES[0][0]]
        ),
        to: KEEPERS[0],
      }, {
        input: KEEPER_IFACE.encodeFunctionData(
          "addStrategy", 
          [STRATEGIES[0][1]]
        ),
        to: KEEPERS[0],
      }, {
        input: KEEPER_IFACE.encodeFunctionData(
          "removeStrategy", 
          [STRATEGIES[1][0]]
        ),
        to: KEEPERS[1],
      });
    let findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
    expect(mockMemory.addStrategy).toHaveBeenCalledTimes(2);
    expect(mockMemory.removeStrategy).toHaveBeenCalledTimes(1);
    expect(mockMemory.addStrategy).nthCalledWith(1, KEEPERS[0], STRATEGIES[0][0], 200);
    expect(mockMemory.addStrategy).nthCalledWith(2, KEEPERS[0], STRATEGIES[0][1], 200);
    expect(mockMemory.removeStrategy).nthCalledWith(1, KEEPERS[1], STRATEGIES[1][0], 200);
  });

  it("should report many type of findings", async () => {
    const handler: HandleTransaction = provideHandleTransaction(
      [IDS[0]], mockFetcher as any, mockMemory as any, 10, 20, 30,
    );
    
    prepareBlock(1, 1);
    mockMemory.update.mockReturnValue(10);
    mockMemory.getCount.mockReturnValue(1);
    when(mockMemory.getLast)
      .calledWith(KEEPERS[0], STRATEGIES[0][0])
      .mockReturnValue(29);
    when(mockMemory.getLast)
      .calledWith(KEEPERS[0], STRATEGIES[0][1])
      .mockReturnValue(10);

    const {data, topics} = REGISTRY_IFACE.encodeEventLog(
      PERFORM_EVENT, performParams(IDS[0], STRATEGIES[0][0]),
    )
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setBlock(1)
      .setTimestamp(40)
      .addAnonymousEventLog(registry, data, ...topics);    

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      noCallsFinding(0, 1, 30, 30),
      multipleCallsFinding(0, 0, 1, 10, FindingSeverity.High),
      multipleCallsFinding(0, 0, 1, 20, FindingSeverity.Medium),
    ]);
  });
});
