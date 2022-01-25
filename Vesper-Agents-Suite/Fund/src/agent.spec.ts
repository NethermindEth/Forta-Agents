import { HandleBlock } from "forta-agent";
import agent from "./agent";
import { createFinding, mockList } from "./utils";
import Mock from "./mock";
import TimeTracker from './time.tracker';
import { TestBlockEvent } from "forta-agent-tools";
import { BlockEvent } from "forta-agent-tools/node_modules/forta-agent";

describe("Vesper Agent 3: Idle fund", () => {
  let handleBlock: HandleBlock;
  const threshold: number = 1000;
  const tracker: TimeTracker = new TimeTracker();
  const startBlock = 2000;

  it("A new transaction gets received. The condition for token funds gives false", async () => {
    let mockWeb3 = {
      eth: {
        Contract: Mock.build_Mock(1000, 150, 800, 10, mockList),
      },
    } as any;

    handleBlock = agent.provideHandleFunction(mockWeb3, threshold, tracker);
    const blockEvent: BlockEvent = new TestBlockEvent().setTimestamp(startBlock)
      .setNumber(100);

    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("The condition for token funds gives true", async () => {
    let mockWeb3 = {
      eth: {
        Contract: Mock.build_Mock(100, 1000, 0.5, 8, mockList.slice(0, 1)),
      },
    } as any;


    handleBlock = agent.provideHandleFunction(mockWeb3, threshold, tracker);
    const blockEvent: BlockEvent = new TestBlockEvent().setTimestamp(startBlock)
      .setNumber(101);

    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([createFinding(mockList[0], 1000)]);
  });

  it("The condition for token funds gives true for multiple pool addresses,", async () => {
    let mockWeb3 = {
      eth: {
        Contract: Mock.build_Mock(100, 1000, 0.5, 8, mockList.slice(1, 3)),
      },
    } as any;


    handleBlock = agent.provideHandleFunction(mockWeb3, threshold, tracker);
    const blockEvent: BlockEvent = new TestBlockEvent().setTimestamp(startBlock)
      .setNumber(102);

    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([createFinding(mockList[1], 1000), createFinding(mockList[2], 1000)]);
  });
});
