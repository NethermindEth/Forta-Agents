import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent,
  HandleBlock,
  BlockEvent
} from "forta-agent";
import agent, { provideHandleBlock } from "./agent";
import { TestBlockEvent, createAddress } from "forta-agent-tools";
import { when } from "jest-when";
import { BigNumber } from "ethers";

type TEST_CASE = [string, string, string, string];

const createFinding = (meta: string[]): Finding => Finding.fromObject({
  name: "Pickle V3 Strategies tick monitor",
  description: "Tick is out of range",
  alertId: "pickle-rmm",
  severity: FindingSeverity.High,
  type: FindingType.Info,
  metadata: {
    strategy: meta[0],
    tick_lower: meta[1],
    current_tick: meta[2],
    tick_upper: meta[3],
  }
})

describe("RMM agent tests suite", () => {
  const mockStrategies = jest.fn();
  const mockTicks = jest.fn();
  const mockFetcher = {
    getStrategies: mockStrategies,
    getTicks: mockTicks,
  };
  const handler: HandleBlock = provideHandleBlock(mockFetcher as any);

  it("should return empty findings if there is no strategies", async () => {
    when(mockStrategies)
      .calledWith(10)
      .mockReturnValueOnce([]);

    const block: BlockEvent = new TestBlockEvent().setNumber(10);
    const findings: Finding[] = await handler(block);
    expect(findings).toStrictEqual([]);
  });

  it("should return empty findings if the current tick is in range", async () => {
    when(mockStrategies)
      .calledWith(101)
      .mockReturnValueOnce([createAddress("0xdead")]);
    when(mockTicks)
      .calledWith(101, createAddress("0xdead"))
      .mockReturnValueOnce({
        lower: BigNumber.from(1),
        current: BigNumber.from(2),
        upper: BigNumber.from(3),
      })

    const block: BlockEvent = new TestBlockEvent().setNumber(101);
    const findings: Finding[] = await handler(block);
    expect(findings).toStrictEqual([]);
  });

  it("should return multiple findings", async () => {
    const CASES: TEST_CASE[] = [
      [createAddress("0x1"), "1", "20", "3"],
      [createAddress("0x2"), "2", "1", "9"],
      [createAddress("0x3"), "15", "15", "15"],
      [createAddress("0x4"), "100", "99", "100"],
    ];

    when(mockStrategies)
      .calledWith(80)
      .mockReturnValueOnce(CASES.map(([addr,,,]: TEST_CASE) => addr));
    for(let [addr, lower, current, upper] of CASES){
      when(mockTicks)
        .calledWith(80, addr)
        .mockReturnValueOnce({
          lower: BigNumber.from(lower),
          current: BigNumber.from(current),
          upper: BigNumber.from(upper),
        })
    }

    const block: BlockEvent = new TestBlockEvent().setNumber(80);
    const findings: Finding[] = await handler(block);
    expect(findings).toStrictEqual([
      createFinding(CASES[0]),
      createFinding(CASES[1]),
      createFinding(CASES[3]),
    ]);
  });
});
