import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent"
import MockProvider from "./mock.provider";
import ReserveFetcher from "./reserve.fetcher";
import { createAddress, encodeParameter, TestTransactionEvent } from "forta-agent-tools";
import { provideHandleTransaction } from "./agent";
import { BigNumber } from "ethers";
import abi from "./abi";

const reserveIncreasement = (
  initialReserve: number, 
  curReserve: number, 
): Finding => Finding.fromObject({
  name: "OlympusDAO Treasury totalReserves monitor",
  description: "Big increasement detected",
  alertId: "olympus-treasury-3-1",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  protocol: "OlympusDAO",
  metadata: {
    totalReserve: initialReserve.toString(),
    changedTo: curReserve.toString(),
  },
});

const reserveDecreasement = (
  initialReserve: number, 
  curReserve: number, 
): Finding => Finding.fromObject({
  name: "OlympusDAO Treasury totalReserves monitor",
  description: "Big decreasement detected",
  alertId: "olympus-treasury-3-2",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  protocol: "OlympusDAO",
  metadata: {
    totalReserve: initialReserve.toString(),
    changedTo: curReserve.toString(),
  },
});

describe("totalReserve Agent test suite", () => {
  const treasury: string = createAddress("0xdead");
  const provider: MockProvider = new MockProvider();
  const fetcher: ReserveFetcher = new ReserveFetcher(treasury, provider as any);
  const handler: HandleTransaction = provideHandleTransaction(fetcher, 20);

  beforeAll(() => {
    provider
      .addCallTo(
        treasury,
        9,
        abi.TREASURY_IFACE,
        "totalReserves",
        {inputs: [], outputs: [100]},
      )
      .addCallTo(
        treasury,
        19,
        abi.TREASURY_IFACE,
        "totalReserves",
        {inputs: [], outputs: [1000]},
      );
  });

  beforeEach(() => fetcher.clear());
  
  it("should ignore transactions not emitting events", async () => {
    const tx: TransactionEvent =  new TestTransactionEvent().setBlock(1)
    fetcher.update(1, BigNumber.from(2));

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore transactions not emitting the correct event", async () => {
    const tx: TransactionEvent =  new TestTransactionEvent()
      .setBlock(2)
      .addEventLog(
        "MyEvent(uint256)",
        treasury,
        "0x",
        encodeParameter('uint256', 20),
      );
    fetcher.update(2, BigNumber.from(234));

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore transactions emitting the correct event in the wrong contract", async () => {
    const tx: TransactionEvent =  new TestTransactionEvent()
      .setBlock(10)
      .addEventLog(
        "ReservesUpdated(uint256)",
        createAddress("0xc0de"),
        "0x",
        encodeParameter('uint256', 120),
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect big changes", async () => {
    const tx: TransactionEvent =  new TestTransactionEvent()
      .setBlock(10)
      .addEventLog(
        "ReservesUpdated(uint256)",
        treasury,
        "0x",
        encodeParameter('uint256', 120),
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      reserveIncreasement(100, 120),
    ]);
  });

  it("should detect multiple findings", async () => {
    const tx: TransactionEvent =  new TestTransactionEvent()
      .setBlock(20)
      .addEventLog(
        "ReservesUpdated(uint256)",
        treasury,
        "0x",
        encodeParameter('uint256', 1200), // big
      )
      .addEventLog(
        "ReservesUpdated(uint256)",
        treasury,
        "0x",
        encodeParameter('uint256', 1400),
      )
      .addEventLog(
        "ReservesUpdated(uint256)",
        treasury,
        "0x",
        encodeParameter('uint256', 1680), // big
      )
      .addEventLog(
        "ReservesUpdated(uint256)",
        treasury,
        "0x",
        encodeParameter('uint256', 1600),
      )
      .addEventLog(
        "ReservesUpdated(uint256)",
        treasury,
        "0x",
        encodeParameter('uint256', 1000), // big
      )
      .addEventLog(
        "ReservesUpdated(uint256)",
        treasury,
        "0x",
        encodeParameter('uint256', 800), // big
      )

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      reserveIncreasement(1000, 1200),
      reserveIncreasement(1400, 1680),
      reserveDecreasement(1600, 1000),
      reserveDecreasement(1000, 800),
    ]);
  });
 
});
