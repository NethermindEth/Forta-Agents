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
  createAddress("0xDA01"),
  createAddress("0xDA02"),
]
const STRATEGIES: string[][] = [
  [createAddress("0xD071"), createAddress("0xE0A")],
  [createAddress("0xD1A")],
]
const REGISTRY_IFACE: Interface = new Interface(abi.REGISTRY);
const PERFORM_EVENT: EventFragment = REGISTRY_IFACE.getEvent("UpkeepPerformed");
const KEEPER_IFACE: Interface = new Interface(abi.KEEPER);


const multipleCallsFinding = (
  index: number,
  strategyIndex: number,
  last: number,
  count: number,
  frame: number,
  severity: FindingSeverity,
): Finding => Finding.fromObject({
  name: "Pickle Volatility Monitor",
  description: "Many performUpkeep calls",
  alertId: "pickle-vm-1",
  type: FindingType.Info,
  severity,
  metadata: {
    keeperId: IDS[index].toString(),
    keeperAddress: KEEPERS[index].toLowerCase(),
    strategyAddress: STRATEGIES[index][strategyIndex].toLowerCase(),
    timeSinceLastUpkeep: last.toString(),
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
  metadata: {
    keeperId: IDS[index].toString(),
    keeperAddress: KEEPERS[index].toLowerCase(),
    strategyAddress: STRATEGIES[index][strategyIndex].toLowerCase(),
    timeSinceLastUpkeep: last.toString(),
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

  const prepareBlock = (block: number, length: number=IDS.length) => {
    for(let i = 0; i < length; ++i){
      when(mockFetcher.getUpkeep)
        .calledWith(block, IDS[i])
        .mockReturnValue(KEEPERS[i].toLowerCase());
      when(mockFetcher.getUpkeep)
        .calledWith(block, BigNumber.from(IDS[i]))
        .mockReturnValue(KEEPERS[i].toLowerCase());
      when(mockFetcher.getStrategies)
        .calledWith(block, KEEPERS[i].toLowerCase())
        .mockReturnValue(STRATEGIES[i].map(strat => strat.toLowerCase()));
    }
  };

  const performParams = (id: number, addr: string) => [
    id, 
    // random params unused in the agent ---
    true, createAddress("0xdead"), 1,
    // -------------------------------------
    utils.encodePerformData(createAddress(addr)),
  ];

  beforeEach(() => resetAllWhenMocks())

  it("should return empty findings in the there is noting to report", async () => {
    prepareBlock(15);
    const handler: HandleTransaction = provideHandleTransaction(
      IDS, mockFetcher as any, 2, 3, 4, 2,
    );

    const tx: TransactionEvent = new TestTransactionEvent().setBlock(15).setTimestamp(1);
    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should report short periord findings", async () => {
    const handler: HandleTransaction = provideHandleTransaction(
      IDS, mockFetcher as any, 2, 4, 5, 2,
    );
    
    prepareBlock(0);
    prepareBlock(1);
    prepareBlock(2);
    prepareBlock(10);

    // initialization call
    let tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(0)
      .setTimestamp(0);
    let findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);

    // first perfoemUpkeep call
    const {data, topics} = REGISTRY_IFACE.encodeEventLog(
      PERFORM_EVENT, performParams(IDS[1], STRATEGIES[1][0]),
    )
    tx = new TestTransactionEvent()
      .setBlock(1)
      .setTimestamp(1)
      .addAnonymousEventLog(registry, data, ...topics);
    findings = await handler(tx);
    expect(findings).toStrictEqual([]);

    // second perfoemUpkeep call
    tx = new TestTransactionEvent()
      .setBlock(2)
      .setTimestamp(2)
      .addAnonymousEventLog(registry, data, ...topics);
    findings = await handler(tx);
    expect(findings).toStrictEqual([]);

    // time passed
    tx = new TestTransactionEvent()
      .setBlock(10)
      .setTimestamp(4)
    findings = await handler(tx);
    expect(findings).toStrictEqual([
      multipleCallsFinding(1, 0, 2, 2, 2, FindingSeverity.High)
    ]);
  });

  it("should report medium periord findings", async () => {
    const handler: HandleTransaction = provideHandleTransaction(
      IDS, mockFetcher as any, 2, 4, 200, 2,
    );
    
    prepareBlock(1);
    prepareBlock(10);
    prepareBlock(11);

    // first perfoemUpkeep call
    const {data, topics} = REGISTRY_IFACE.encodeEventLog(
      PERFORM_EVENT, performParams(IDS[0], STRATEGIES[0][1]),
    )
    let tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(1)
      .setTimestamp(4)
      .addAnonymousEventLog(registry, data, ...topics);
    let findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);

    // second perfoemUpkeep call
    tx = new TestTransactionEvent()
      .setBlock(10)
      .setTimestamp(8)
      .addAnonymousEventLog(registry, data, ...topics);
    findings = await handler(tx);
    expect(findings).toStrictEqual([]);

    // time passed
    tx = new TestTransactionEvent()
      .setBlock(11)
      .setTimestamp(200)
    findings = await handler(tx);
    expect(findings).toStrictEqual([
      multipleCallsFinding(0, 1, 192, 2, 4, FindingSeverity.Medium)
    ]);
  });

  it("should report huge periord findings", async () => {
    const handler: HandleTransaction = provideHandleTransaction(
      IDS, mockFetcher as any, 2, 4, 100, 2,
    );
    
    prepareBlock(2);
    prepareBlock(3);
    prepareBlock(4);

    // first perfoemUpkeep call
    let tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(2)
      .setTimestamp(100)
    let findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);

    // second perfoemUpkeep call
    tx = new TestTransactionEvent()
      .setBlock(3)
      .setTimestamp(200)
    findings = await handler(tx);
    expect(findings).toStrictEqual([]);

    // time passed
    tx = new TestTransactionEvent()
      .setBlock(4)
      .setTimestamp(201)
    findings = await handler(tx);
    expect(findings).toStrictEqual([
      noCallsFinding(0, 0, 201, 100),
      noCallsFinding(0, 1, 201, 100),
      noCallsFinding(1, 0, 201, 100),
    ]);
  });

  it("should detect amounts greater than the threshold", async () => {
    const handler: HandleTransaction = provideHandleTransaction(
      IDS, mockFetcher as any, 2, 4, 100, 2,
    );
    
    prepareBlock(5);
    prepareBlock(10);

    // first perfoemUpkeep call
    const {data, topics} = REGISTRY_IFACE.encodeEventLog(
      PERFORM_EVENT, performParams(IDS[0], STRATEGIES[0][0]),
    )
    let tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(5)
      .setTimestamp(100)
      .addAnonymousEventLog(registry, data, ...topics)
      .addAnonymousEventLog(registry, data, ...topics)
      .addAnonymousEventLog(registry, data, ...topics)
      .addAnonymousEventLog(registry, data, ...topics)
      .addAnonymousEventLog(registry, data, ...topics);
    let findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);

    // time passed
    tx = new TestTransactionEvent()
      .setBlock(10)
      .setTimestamp(103)
    findings = await handler(tx);
    expect(findings).toStrictEqual([
      multipleCallsFinding(0, 0, 3, 5, 2, FindingSeverity.High),
    ]);
  });

  it("should report huge periord if recently added", async () => {
    const handler: HandleTransaction = provideHandleTransaction(
      IDS, mockFetcher as any, 2, 4, 100, 2,
    );
    
    prepareBlock(2);
    prepareBlock(3);
    prepareBlock(4);

    // first perfoemUpkeep call
    let tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(2)
      .setTimestamp(100)
    let findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);

    // second perfoemUpkeep call
    tx = new TestTransactionEvent()
      .setBlock(3)
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
          "addStrategy", 
          [STRATEGIES[1][0]]
        ),
        to: KEEPERS[1],
      });
    findings = await handler(tx);
    expect(findings).toStrictEqual([]);

    // time passed
    tx = new TestTransactionEvent()
      .setBlock(4)
      .setTimestamp(201)
    findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should report many type of findings", async () => {
    const handler: HandleTransaction = provideHandleTransaction(
      IDS, mockFetcher as any, 10, 20, 30, 4,
    );
    
    prepareBlock(1);
    prepareBlock(2);

    let {data, topics} = REGISTRY_IFACE.encodeEventLog(
      PERFORM_EVENT, performParams(IDS[1], STRATEGIES[1][0]),
    )
    let tx: TestTransactionEvent = new TestTransactionEvent()
      .setBlock(1)
      .setTimestamp(10)
      .addAnonymousEventLog(registry, data, ...topics)
      .addAnonymousEventLog(registry, data, ...topics)
      .addAnonymousEventLog(registry, data, ...topics)
      .addAnonymousEventLog(registry, data, ...topics);

    ({data, topics} = REGISTRY_IFACE.encodeEventLog(
      PERFORM_EVENT, performParams(IDS[0], STRATEGIES[0][0]),
    ));
    tx.addAnonymousEventLog(registry, data, ...topics)
      .addAnonymousEventLog(registry, data, ...topics)
      .addAnonymousEventLog(registry, data, ...topics);

    let findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);

    tx = new TestTransactionEvent()
      .setBlock(2)
      .setTimestamp(2000);
    findings = await handler(tx);
    expect(findings).toStrictEqual([
      multipleCallsFinding(1, 0, 1990, 4, 10, FindingSeverity.High),
      multipleCallsFinding(1, 0, 1990, 4, 20, FindingSeverity.Medium),
      noCallsFinding(0, 1, 2000, 30),
    ]);
  });
});
