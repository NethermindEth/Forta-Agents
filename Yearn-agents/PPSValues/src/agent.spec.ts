import {
  FindingType,
  FindingSeverity,
  Finding,
  createTransactionEvent,
  HandleBlock,
} from "forta-agent";
import { TestBlockEvent } from "forta-agent-tools";
import agent, { createFinding } from "./agent";
import MockWeb3 from "./mock";

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
    const blockEvent = new TestBlockEvent();

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("Returns findings if pps decreases", async () => {
    const blockEvent = new TestBlockEvent();

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFinding("100", "101", "Decrese in PPS"),
    ]);
  });

  it("Returns findings if swift change in pps", async () => {
    const blockEvent = new TestBlockEvent();
    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual(
      createFinding("200", "100", "Very Swift change")
    );
  });

  it("Returns findings when swift change +  pps decrease", async () => {
    const blockEvent = new TestBlockEvent();
    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual(
      createFinding("300", "200", "Very Swift change")
    );
  });
});
