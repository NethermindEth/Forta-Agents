import { HandleBlock } from "forta-agent";
import agent from "./agent";
import { createFinding, mockList } from "./utils";
import Mock from "./mock";

describe("Vesper Agent 3: Idle fund", () => {
  let handleBlock: HandleBlock;

  afterAll(() => {});

  it("A new transaction gets received. The condition for tokenfunds gives false", async () => {
    let mockWeb3 = {
      eth: {
        Contract: Mock.build_Mock(1000, 150, 800, 10, mockList),
      },
    } as any;

    handleBlock = agent.provideHandleFunction(mockWeb3 as any);

    const findings = await handleBlock({ block: { number: 100 } } as any);
    expect(findings).toStrictEqual([]);
  });

  it(" The condition for tokenfunds gives true", async () => {
    let mockWeb3 = {
      eth: {
        Contract: Mock.build_Mock(100, 1000, 0.5, 8, mockList.slice(0, 1)),
      },
    } as any;

    handleBlock = agent.provideHandleFunction(mockWeb3 as any);

    const findings = await handleBlock({ block: { number: 101 } } as any);
    expect(findings).toStrictEqual([createFinding(250)]);
  });

  it("xThe condition for tokenfunds gives true, and for multiple pool addresses,", async () => {
    let mockWeb3 = {
      eth: {
        Contract: Mock.build_Mock(100, 1000, 0.5, 8, mockList.slice(0, 2)),
      },
    } as any;

    handleBlock = agent.provideHandleFunction(mockWeb3 as any);

    const findings = await handleBlock({ block: { number: 102 } } as any);
    expect(findings).toStrictEqual([createFinding(250), createFinding(250)]);
  });
});
