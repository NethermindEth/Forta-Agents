import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { provideHandleTransaction } from "./agent";
import PairFetcher from "./pair.fetcher";
import { createAddress, MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import abi from "./abi";
import utils from "./utils";

const createFinding = (...addrs: string[]) => Finding.fromObject({
  name: "Uniswap pools suspicious activities",
  description: "Some pairs might be being drained",
  alertId: "NETHFORTA-UNI",
  type: FindingType.Suspicious,
  severity: FindingSeverity.Critical,
  protocol: "Uniswap",
  metadata: {
    pairs: addrs.toString(),
  }
});

describe("Pool drained test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const fetcher: PairFetcher = new PairFetcher(mockProvider as any); 
  const handler: HandleTransaction = provideHandleTransaction(fetcher);

  const addV2Pair = (addr: string, t0: string, t1: string, block: number) => {
    mockProvider.addCallTo(
      addr, block, abi.COMMON_IFACE, "token0", {
        inputs: [], outputs: [t0],
      },
    );
    mockProvider.addCallTo(
      addr, block, abi.COMMON_IFACE, "token1", {
        inputs: [], outputs: [t1],
      },
    );
  };

  const addV3Pair = (addr: string, t0: string, t1: string, fee: number, block: number) => {
    addV2Pair(addr, t0, t1, block);
    mockProvider.addCallTo(
      addr, block, abi.COMMON_IFACE, "fee", {
        inputs: [], outputs: [fee],
      },
    );
  };

  beforeEach(() => mockProvider.clear());

  it("should allow 1 transfer on V2 mint calls", async () => {
    const t0: string = createAddress("0xe0a");
    const t1: string = createAddress("0xdef1");
    const pair: string = utils.v2Create2(t0, t1);
    const block: number = 42;

    addV2Pair(pair, t0, t1, block);

    const tx: TransactionEvent = new TestTransactionEvent().setBlock(block)
      .addInterfaceEventLog(
        abi.TRANSFER_IFACE.getEvent("Transfer"), 
        t0, [pair, createAddress("0x1"), 10],  
      )
      .addTraces({
        to: pair,
        input: abi.V2_IFACE.encodeFunctionData(
          abi.V2_IFACE.getFunction("mint"), [createAddress("0x2")],
        )
      });

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should allow 1 transfer on V2 burn calls", async () => {
    const t0: string = createAddress("0xaaaaa");
    const t1: string = createAddress("0xbbbbb");
    const pair: string = utils.v2Create2(t0, t1);
    const block: number = 1111;

    addV2Pair(pair, t0, t1, block);

    const tx: TransactionEvent = new TestTransactionEvent().setBlock(block)
      .addInterfaceEventLog(
        abi.TRANSFER_IFACE.getEvent("Transfer"), 
        t0, [pair, createAddress("0x1231"), 1],  
      )
      .addTraces({
        to: pair,
        input: abi.V2_IFACE.encodeFunctionData(
          abi.V2_IFACE.getFunction("burn"), [createAddress("0x3")],
        )
      });

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should allow 1 transfer on V2 swap calls", async () => {
    const t0: string = createAddress("0x123");
    const t1: string = createAddress("0xdef");
    const pair: string = utils.v2Create2(t0, t1);
    const block: number = 1234;

    addV2Pair(pair, t0, t1, block);

    const tx: TransactionEvent = new TestTransactionEvent().setBlock(block)
      .addInterfaceEventLog(
        abi.TRANSFER_IFACE.getEvent("Transfer"), 
        t0, [createAddress("0xdef1"), pair, 555],  
      )
      .addTraces({
        to: pair,
        input: abi.V2_IFACE.encodeFunctionData(
          abi.V2_IFACE.getFunction("swap"), [1, 2, createAddress("0x3"), "0x00"],
        )
      });

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should allow 1 transfer on V2 skim calls", async () => {
    const t0: string = createAddress("0xbad");
    const t1: string = createAddress("0xf00d");
    const pair: string = utils.v2Create2(t0, t1);
    const block: number = 9876;

    addV2Pair(pair, t0, t1, block);

    const tx: TransactionEvent = new TestTransactionEvent().setBlock(block)
      .addInterfaceEventLog(
        abi.TRANSFER_IFACE.getEvent("Transfer"), 
        t0, [createAddress("0xdef1"), pair, 66],  
      )
      .addTraces({
        to: pair,
        input: abi.V2_IFACE.encodeFunctionData(
          abi.V2_IFACE.getFunction("skim"), [createAddress("0xd1fa1")],
        )
      });

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should allow 2 transfer on V2 flash loans", async () => {
    const t0: string = createAddress("0x123456");
    const t1: string = createAddress("0xfee");
    const pair: string = utils.v2Create2(t0, t1);
    const block: number = 5;

    addV2Pair(pair, t0, t1, block);

    const tx: TransactionEvent = new TestTransactionEvent().setBlock(block)
      .addInterfaceEventLog(
        abi.TRANSFER_IFACE.getEvent("Transfer"), 
        t1, [createAddress("0xdef1"), pair, 5],  
      )
      .addInterfaceEventLog(
        abi.TRANSFER_IFACE.getEvent("Transfer"), 
        t1, [pair, createAddress("0xd"), 4],  
      )
      .addTraces({
        to: pair,
        input: abi.V2_IFACE.encodeFunctionData(
          abi.V2_IFACE.getFunction("swap"), [10, 22, createAddress("0x3"), "0x01"],
        )
      });

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should allow 1 transfer on V3 mint calls", async () => {
    const t0: string = createAddress("0xe0a1");
    const t1: string = createAddress("0xdef11");
    const fee: number = 1;
    const pair: string = utils.v3Create2(t0, t1, fee);
    const block: number = 421;

    addV3Pair(pair, t0, t1, fee, block);

    const tx: TransactionEvent = new TestTransactionEvent().setBlock(block)
      .addInterfaceEventLog(
        abi.TRANSFER_IFACE.getEvent("Transfer"), 
        t0, [pair, createAddress("0x11"), 101],  
      )
      .addTraces({
        to: pair,
        input: abi.V3_IFACE.encodeFunctionData(
          abi.V3_IFACE.getFunction("mint"), [createAddress("0x2"), 1, 2, 3, "0x00"],
        )
      });

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should allow 1 transfer on V3 burn calls", async () => {
    const t0: string = createAddress("0xe0a11");
    const t1: string = createAddress("0xdef111");
    const fee: number = 11;
    const pair: string = utils.v3Create2(t0, t1, fee);
    const block: number = 4211;

    addV3Pair(pair, t0, t1, fee, block);

    const tx: TransactionEvent = new TestTransactionEvent().setBlock(block)
      .addInterfaceEventLog(
        abi.TRANSFER_IFACE.getEvent("Transfer"), 
        t0, [pair, createAddress("0x111"), 1011],  
      )
      .addTraces({
        to: pair,
        input: abi.V3_IFACE.encodeFunctionData(
          abi.V3_IFACE.getFunction("burn"), [2, 3, 4],
        )
      });

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should allow 1 transfer on V3 collect calls", async () => {
    const t0: string = createAddress("0xe0a12");
    const t1: string = createAddress("0xdef112");
    const fee: number = 12;
    const pair: string = utils.v3Create2(t0, t1, fee);
    const block: number = 4212;

    addV3Pair(pair, t0, t1, fee, block);

    const tx: TransactionEvent = new TestTransactionEvent().setBlock(block)
      .addInterfaceEventLog(
        abi.TRANSFER_IFACE.getEvent("Transfer"), 
        t1, [pair, createAddress("0x112"), 1021],  
      )
      .addTraces({
        to: pair,
        input: abi.V3_IFACE.encodeFunctionData(
          abi.V3_IFACE.getFunction("collect"), [createAddress("0x22"), 3, 4, 5, 6],
        )
      });

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should allow 1 transfer on V3 swap calls", async () => {
    const t0: string = createAddress("0xe0a123");
    const t1: string = createAddress("0xdef1123");
    const fee: number = 123;
    const pair: string = utils.v3Create2(t0, t1, fee);
    const block: number = 42123;

    addV3Pair(pair, t0, t1, fee, block);

    const tx: TransactionEvent = new TestTransactionEvent().setBlock(block)
      .addInterfaceEventLog(
        abi.TRANSFER_IFACE.getEvent("Transfer"), 
        t0, [pair, createAddress("0x1123"), 10213],  
      )
      .addTraces({
        to: pair,
        input: abi.V3_IFACE.encodeFunctionData(
          abi.V3_IFACE.getFunction("swap"), [createAddress("0x223"), true, 33, 43, "0x00"],
        )
      });

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should allow 2 transfer on V3 flash calls", async () => {
    const t0: string = createAddress("0x2");
    const t1: string = createAddress("0x3");
    const fee: number = 4;
    const pair: string = utils.v3Create2(t0, t1, fee);
    const block: number = 5;

    addV3Pair(pair, t0, t1, fee, block);

    const tx: TransactionEvent = new TestTransactionEvent().setBlock(block)
      .addInterfaceEventLog(
        abi.TRANSFER_IFACE.getEvent("Transfer"), 
        t1, [pair, createAddress("0x6"), 7],  
      )
      .addTraces({
        to: pair,
        input: abi.V3_IFACE.encodeFunctionData(
          abi.V3_IFACE.getFunction("flash"), [createAddress("0x8"), 9, 10, "0x11"],
        )
      })
      .addInterfaceEventLog(
        abi.TRANSFER_IFACE.getEvent("Transfer"), 
        t1, [createAddress("0x12"), pair, 13],  
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should allow 1 transfer on V3 collectProtocol calls", async () => {
    const t0: string = createAddress("0xb");
    const t1: string = createAddress("0xc");
    const fee: number = 14;
    const pair: string = utils.v3Create2(t0, t1, fee);
    const block: number = 15;

    addV3Pair(pair, t0, t1, fee, block);

    const tx: TransactionEvent = new TestTransactionEvent().setBlock(block)
      .addInterfaceEventLog(
        abi.TRANSFER_IFACE.getEvent("Transfer"), 
        t0, [pair, createAddress("0xf"), 17],  
      )
      .addTraces({
        to: pair,
        input: abi.V3_IFACE.encodeFunctionData(
          abi.V3_IFACE.getFunction("collectProtocol"), [createAddress("0xf"), 15, 14],
        )
      });

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect irregular transfers", async () => {
    const block: number = 420;
    const v3 = {
      t0: createAddress("0x2"),
      t1: createAddress("0x3"),
      fee: 4,
      pair: utils.v3Create2(
        createAddress("0x2"), 
        createAddress("0x3"), 
        4
      ),
    };
    const v2 = {
      t0: createAddress("0x6"),
      t1: createAddress("0x7"),
      pair: utils.v2Create2(
        createAddress("0x6"), 
        createAddress("0x7"), 
      ),
    };

    addV3Pair(v3.pair, v3.t0, v3.t1, v3.fee, block);
    addV2Pair(v2.pair, v2.t0, v2.t1, block);

    const tx: TransactionEvent = new TestTransactionEvent().setBlock(block)
      .addInterfaceEventLog(
        abi.TRANSFER_IFACE.getEvent("Transfer"), 
        v3.t0, [v3.pair, createAddress("0x8"), 9],  
      )
      .addInterfaceEventLog(
        abi.TRANSFER_IFACE.getEvent("Transfer"), 
        v3.t0, [v3.pair, createAddress("0x10"), 11],  
      )
      .addInterfaceEventLog(
        abi.TRANSFER_IFACE.getEvent("Transfer"), 
        v3.t1, [createAddress("0x12"), v3.pair, 13],  
      )
      .addInterfaceEventLog(
        abi.TRANSFER_IFACE.getEvent("Transfer"), 
        v3.t0, [createAddress("0x14"), v3.pair, 15],  
      )
      .addTraces({
        to: v3.pair,
        input: abi.V3_IFACE.encodeFunctionData(
          abi.V3_IFACE.getFunction("mint"), [createAddress("0x16"), 17, 18, 19, "0x20"],
        )
      })
      .addTraces({
        to: v3.pair,
        input: abi.V3_IFACE.encodeFunctionData(
          abi.V3_IFACE.getFunction("burn"), [21, 22, 23],
        )
      })
      
      .addInterfaceEventLog(
        abi.TRANSFER_IFACE.getEvent("Transfer"), 
        v2.t1, [createAddress("0x88"), v2.pair, 99],  
      )
      .addInterfaceEventLog(
        abi.TRANSFER_IFACE.getEvent("Transfer"), 
        v2.t1, [createAddress("0x888"), v2.pair, 999],  
      )
      .addTraces({
        to: v2.pair,
        input: abi.V2_IFACE.encodeFunctionData(
          abi.V2_IFACE.getFunction("skim"), [createAddress("0x1616")],
        )
      });

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding(v3.pair, v2.pair),
    ]);
  });
});
