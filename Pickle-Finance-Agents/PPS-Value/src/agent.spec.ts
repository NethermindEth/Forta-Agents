import { 
  BlockEvent, 
  Finding, 
  FindingSeverity, 
  FindingType, 
  HandleBlock 
} from "forta-agent";
import { 
  createAddress, 
  TestBlockEvent 
} from "forta-agent-tools";
import { provideHandleBlock } from "./agent";
import { when } from "jest-when";
import { BigNumber } from "ethers";

const VAULTS_DATA: [string, number, number][] = [
  // addr, ratio, oldRatio
  [createAddress("0xfee5"), 1, 1],
  [createAddress("0xdef1"), 2, 3], 
  [createAddress("0xc0de"), 3, 10],
  [createAddress("0xe0a1"), 30, 30],
  [createAddress("0xf1a7"), 4, 2],
  [createAddress("0xca11"), 5, 6],
]
const VAULTS: string[] = VAULTS_DATA.map(data => data[0]);

const finding = (
  vault: string, 
  cur: number, 
  prev: number,
  change: string,
  id: string,
): Finding => Finding.fromObject({
  name: "Vault PPS anomaly detected",
  description: `Vault PPS ${change}`,
  alertId:  `pickle-5-${id}`,
  protocol: "Pickle Finance",
  severity: FindingSeverity.High,
  type: FindingType.Suspicious,
  metadata: {
    vault,
    curRatio: cur.toString(),
    prevRatio: prev.toString(),
  },
});

const createFinding = (
  vault: string, 
  cur: number, 
  prev: number,
  inc: boolean,
): Finding => inc? 
  finding(vault, cur, prev, "increasement", "1"): 
  finding(vault, cur, prev, "decreasement", "2"); 


describe("PPS value monitor agent tests suite", () => {
  const mockGetVaults = jest.fn();
  const mockGetPPS = jest.fn();
  const mockFetcher = {
    getVaults: mockGetVaults,
    getPPS: mockGetPPS,
  }
  const handler: HandleBlock = provideHandleBlock(mockFetcher as any, BigNumber.from(0));

  beforeEach(() => {
    mockGetPPS.mockClear();
    mockGetVaults.mockClear();
  })

  it("should return empty findings if there are no vaults", async () => {
    when(mockGetVaults)
      .calledWith(20)
      .mockReturnValueOnce([]);
    
    const block: BlockEvent = new TestBlockEvent().setNumber(20);
    const findings: Finding[] = await handler(block);
    expect(findings).toStrictEqual([]);
    expect(mockGetVaults).toBeCalled;
  });

  it("should return empty findings if PPS remais equal", async () => {
    when(mockGetVaults)
      .calledWith(10)
      .mockReturnValueOnce([VAULTS[0]]);
    when(mockGetPPS)
      .calledWith(10, VAULTS[0])
      .mockReturnValueOnce(BigNumber.from(1));
    when(mockGetPPS)
      .calledWith(9, VAULTS[0])
      .mockReturnValueOnce(BigNumber.from(1));

    const block: BlockEvent = new TestBlockEvent().setNumber(10);
    const findings: Finding[] = await handler(block);
    expect(findings).toStrictEqual([]);
    expect(mockGetPPS).toBeCalled;
  });

  it("should return multiple findings", async () => {
    const expectedFindings: Finding[] = [];

    when(mockGetVaults)
      .calledWith(200)
      .mockReturnValueOnce(VAULTS);
    for(let [addr, ratio, oldRatio] of VAULTS_DATA){
      when(mockGetPPS)
        .calledWith(200, addr)
        .mockReturnValueOnce(BigNumber.from(ratio));
      when(mockGetPPS)
        .calledWith(199, addr)
        .mockReturnValueOnce(BigNumber.from(oldRatio));
      if(oldRatio > ratio)
        expectedFindings.push(createFinding(addr, ratio, oldRatio, false));
      if(oldRatio < ratio)
        expectedFindings.push(createFinding(addr, ratio, oldRatio, true));
    }

    const block: BlockEvent = new TestBlockEvent().setNumber(200);
    const findings: Finding[] = await handler(block);
    expect(findings).toStrictEqual(expectedFindings);
  });
});
