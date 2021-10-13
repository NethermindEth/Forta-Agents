import {
  BlockEvent,
  EventType,
  Finding,
  FindingSeverity,
  FindingType,
  HandleBlock,
  Network
} from "forta-agent";
import { provideHandleBlock } from ".";

const NUMBER_OF_BLOCK_TO_TEST: number = 4;

const DIFFICULTY_BY_BLOCK: { [key: number]: number } = {
  121209: 129,
  121210: 131,
  121211: 130,
  121212: 128,
  121213: 135,
  121214: 145,
  121215: 147,
  121216: 138,
  121217: 149,
  121218: 156,
  121219: 160,
  121220: 140
};

const createBlockEvent = (blockNumber: number): BlockEvent => {
  return new BlockEvent(
    EventType.BLOCK,
    Network.MAINNET,
    "0x",
    blockNumber,
    {} as any
  );
};

describe("Test difficulty change agent", () => {
  const mockBlockDifficultyGetter: any = {
    getDifficulty: jest.fn((blockNumber) => DIFFICULTY_BY_BLOCK[blockNumber])
  };
  const blockHandler: HandleBlock = provideHandleBlock(
    mockBlockDifficultyGetter,
    NUMBER_OF_BLOCK_TO_TEST
  );

  it("should returns no findings if difficulty changes usuals", async () => {
    const blockToCheck: number = 121215;
    const blockEvent = createBlockEvent(blockToCheck);
    const findings = await blockHandler(blockEvent);

    expect(findings.length).toStrictEqual(0);
  });

  it("should return finding if difficulty increases too much", async () => {
    const blockToCheck: number = 121214;
    const blockEvent = createBlockEvent(blockToCheck);
    const findings = await blockHandler(blockEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Unusual Difficulty Change Detection",
        description: "Unusual block difficulty change detected.",
        alertId: "NETHFORTA-8",
        severity: FindingSeverity.Info,
        type: FindingType.Suspicious,
        metadata: {
          block: blockToCheck.toString()
        }
      })
    ]);
  });

  it("should return finding if difficulty descreases too much", async () => {
    const blockToCheck: number = 121220;
    const blockEvent = createBlockEvent(blockToCheck);
    const findings = await blockHandler(blockEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Unusual Difficulty Change Detection",
        description: "Unusual block difficulty change detected.",
        alertId: "NETHFORTA-8",
        severity: FindingSeverity.High,
        type: FindingType.Suspicious,
        metadata: {
          block: blockToCheck.toString()
        }
      })
    ]);
  });
});
