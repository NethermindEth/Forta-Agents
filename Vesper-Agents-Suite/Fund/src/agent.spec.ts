import { HandleBlock } from "forta-agent";
import agent from "./agent";
import { createFinding, mockList } from "./utils";
import Mock from "./mock";
import mockAxios from "jest-mock-axios";

describe("Vesper Agent 3: Idle fund", () => {
  let handleBlock: HandleBlock;

  afterAll(() => {
    mockAxios.reset();
  });

  it("A new transaction gets received. The condition for tokenfunds gives false", async () => {
    let mockWeb3 = {
      eth: {
        Contract: Mock.build_Mock(1000, 150, 800, 10),
      },
    } as any;

    handleBlock = agent.provideHandleFunction(
      mockWeb3 as any,
      mockAxios as any
    );

    mockAxios.get.mockResolvedValue(mockList);

    const findings = await handleBlock({} as any);
    expect(findings).toStrictEqual([]);
  });

  it(" The condition for tokenfunds gives true", async () => {
    let mockWeb3 = {
      eth: {
        Contract: Mock.build_Mock(100, 1000, 0.5, 8),
      },
    } as any;

    handleBlock = agent.provideHandleFunction(
      mockWeb3 as any,
      mockAxios as any
    );

    mockAxios.get.mockResolvedValue(mockList.slice(0, 1));

    const findings = await handleBlock({} as any);
    expect(findings).toStrictEqual([createFinding(600)]);
  });

  it("xThe condition for tokenfunds gives true, and for multiple pool addresses,", async () => {
    let mockWeb3 = {
      eth: {
        Contract: Mock.build_Mock(100, 1000, 0.5, 8),
      },
    } as any;

    handleBlock = agent.provideHandleFunction(
      mockWeb3 as any,
      mockAxios as any
    );

    mockAxios.get.mockResolvedValue(mockList.slice(0, 2));

    const findings = await handleBlock({} as any);
    expect(findings).toStrictEqual([createFinding(600), createFinding(600)]);
  });
});
