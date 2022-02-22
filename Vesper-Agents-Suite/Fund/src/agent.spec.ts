import { HandleBlock } from "forta-agent";
import agent from "./agent";
import { createFinding, mockList } from "./utils";
import Mock from "./mock";
import TimeTracker from "./time.tracker";
import { TestBlockEvent } from "forta-agent-tools";
import { BlockEvent } from "forta-agent-tools/node_modules/forta-agent";
const axios = require("axios");
jest.mock("axios");

describe("Vesper Agent 3: Idle fund", () => {
  let handleBlock: HandleBlock;
  const cacheTime: number = 0;
  const tracker: TimeTracker = new TimeTracker();
  const startBlock = 2000;

  function mockPoolList(poolList: string[]){
    const poolData: any = [];
    poolList.forEach((pool) => {
      const value =  {
        contract: {
          address: pool,
        },
        status: "operative",
        stage: "prod"
      }
      poolData.push(value)
    });
    const pools = {
      data: {
        pools: poolData
      },
    } as any;
    (axios.get as jest.Mock).mockResolvedValue(pools);
  }

  beforeEach(() =>{
    jest.resetAllMocks();
  })
  
  it("A new transaction gets received. The condition for token funds gives false", async () => {
    mockPoolList(mockList)
    let mockWeb3 = {
      eth: {
        Contract: Mock.build_Mock(1000, 150, 800, 10),
      },
    } as any;

    handleBlock = agent.provideHandleFunction(mockWeb3, cacheTime, tracker);
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setTimestamp(startBlock)
      .setNumber(100);

    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("The condition for token funds gives true", async () => {
    mockPoolList(mockList.slice(0, 1))
    let mockWeb3 = {
      eth: {
        Contract: Mock.build_Mock(100, 1000, 0.5, 8),
      },
    } as any;

    handleBlock = agent.provideHandleFunction(mockWeb3, cacheTime, tracker);
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setTimestamp(startBlock)
      .setNumber(101);

    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([createFinding(mockList[0], 1000)]);
  });

  it("The condition for token funds gives true for multiple pool addresses,", async () => {
    mockPoolList(mockList.slice(1, 3))
    let mockWeb3 = {
      eth: {
        Contract: Mock.build_Mock(100, 1000, 0.5, 8),
      },
    } as any;
    mockPoolList(mockList.slice(1, 3))
    handleBlock = agent.provideHandleFunction(mockWeb3, cacheTime, tracker);
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setTimestamp(startBlock)
      .setNumber(102);

    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      createFinding(mockList[1], 1000),
      createFinding(mockList[2], 1000),
    ]);
  });
});
