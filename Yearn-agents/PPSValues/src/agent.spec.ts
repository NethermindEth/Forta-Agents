import { HandleBlock } from "forta-agent";
import { TestBlockEvent } from "forta-agent-tools";
import agent, { createFinding } from "./agent";
import MockWeb3, { mockPrice } from "./mock";

describe("PPS ( Price per share ) agent", () => {
  let handleBlock: HandleBlock;

  beforeAll(() => {
    let mockWeb3 = {
      eth: {
        Contract: MockWeb3.build_Mock(),
      },
    } as any;
    handleBlock = agent.provideHandleFunction(mockWeb3 as any);
  });

  it("returns empty findings if pps increases", async () => {
    const blockEvent = new TestBlockEvent().setNumber(1);
    mockPrice.mockReturnValueOnce(1.1);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("Returns nothing if pps remain the same", async () => {
    const blockEvent = new TestBlockEvent().setNumber(2);

    mockPrice.mockReturnValueOnce(1.1);
    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });
  it("Returns findings if pps decreases", async () => {
    const blockEvent = new TestBlockEvent().setNumber(3);

    mockPrice.mockReturnValueOnce(1);
    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      createFinding("1", "1.1", "Decrease in PPS", 1),
    ]);
  });

  it("Returns findings if swift change in pps", async () => {
    const blockEvent = new TestBlockEvent().setNumber(4);
    mockPrice.mockReturnValueOnce(100);
    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFinding("100", "1", "Very Swift change", 2),
    ]);
  });

  it("Returns findings when swift change +  pps decrease", async () => {
    const blockEvent = new TestBlockEvent().setNumber(5);
    mockPrice.mockReturnValueOnce(10);
    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFinding("10", "100", "Decrease in PPS", 1),
      createFinding("10", "100", "Very Swift change", 2),
    ]);
  });
});
