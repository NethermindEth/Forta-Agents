import { provideHandleBlock } from "./agent";
import { BlockEvent, Finding, HandleBlock } from "forta-agent";
import { TestBlockEvent, MockEthersProvider } from "forta-agent-tools/lib/test";
import { when } from "jest-when";
import { createFinding } from "./utils";
import BigNumber from "bignumber.js";

class TestBlockEventExtended extends TestBlockEvent {
  public setDifficulty(difficulty: string): TestBlockEventExtended {
    this.block.difficulty = difficulty;
    return this;
  }

  public setTotalDifficulty(totalDifficulty: string): TestBlockEventExtended {
    this.block.totalDifficulty = totalDifficulty;
    return this;
  }
}

const TEST_BLOCK_DIFFICULTIES: BigNumber[] = [
  new BigNumber(1000),
  new BigNumber(990),
  new BigNumber(1010),
  new BigNumber(1030),
  new BigNumber(940),
];

describe("Unusual changes in block difficulty detection bot test suite", () => {
  const MOCK_NUMBER_OF_BLOCKS_TO_CHECK = 5;
  const MOCK_THRESHOLD = new BigNumber(10);
  const mockProvider = new MockEthersProvider();
  let handleBlock: HandleBlock;

  beforeEach(() => {
    mockProvider.clear(),
      (handleBlock = provideHandleBlock(false, mockProvider as any, MOCK_NUMBER_OF_BLOCKS_TO_CHECK, MOCK_THRESHOLD));
  });

  it("should return no findings if there is no unusual change in block difficulty on the first run", async () => {
    const blockNumber = 105345;
    const blockEvent: BlockEvent = new TestBlockEventExtended().setDifficulty("1000").setNumber(blockNumber);

    for (let i = 0; i <= MOCK_NUMBER_OF_BLOCKS_TO_CHECK; i++) {
      when(mockProvider.getBlock)
        .calledWith(blockNumber - MOCK_NUMBER_OF_BLOCKS_TO_CHECK + i)
        .mockReturnValue({ _difficulty: TEST_BLOCK_DIFFICULTIES[i] });
    }

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if there is an unusual increase in block difficulty on the first run", async () => {
    const blockNumber = 105;
    const blockEvent: BlockEvent = new TestBlockEventExtended().setDifficulty("100000000").setNumber(blockNumber);

    for (let i = 0; i <= MOCK_NUMBER_OF_BLOCKS_TO_CHECK; i++) {
      when(mockProvider.getBlock)
        .calledWith(blockNumber - MOCK_NUMBER_OF_BLOCKS_TO_CHECK + i)
        .mockReturnValue({ _difficulty: TEST_BLOCK_DIFFICULTIES[i] });
    }

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([createFinding("100000000", "20000794", "399.98", MOCK_THRESHOLD.toString(10))]);
  });

  it("should return a finding if there is an unusual decrease in block difficulty on the first run", async () => {
    const blockNumber = 11005;
    const blockEvent: BlockEvent = new TestBlockEventExtended().setDifficulty("10").setNumber(blockNumber);

    for (let i = 0; i <= MOCK_NUMBER_OF_BLOCKS_TO_CHECK; i++) {
      when(mockProvider.getBlock)
        .calledWith(blockNumber - MOCK_NUMBER_OF_BLOCKS_TO_CHECK + i)
        .mockReturnValue({ _difficulty: TEST_BLOCK_DIFFICULTIES[i] });
    }

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([createFinding("10", "796", "98.74", MOCK_THRESHOLD.toString(10))]);
  });

  it("should return no findings if the TTD has been reached on the first run", async () => {
    const blockNumber = 21005;
    const blockEvent: BlockEvent = new TestBlockEventExtended()
      .setDifficulty("10")
      .setTotalDifficulty("58750000000000000000000")
      .setNumber(blockNumber);

    for (let i = 0; i <= MOCK_NUMBER_OF_BLOCKS_TO_CHECK; i++) {
      when(mockProvider.getBlock)
        .calledWith(blockNumber - MOCK_NUMBER_OF_BLOCKS_TO_CHECK + i)
        .mockReturnValue({ _difficulty: TEST_BLOCK_DIFFICULTIES[i] });
    }

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return no findings if there is no unusual change in block difficulty", async () => {
    let blockNumber = 105345;
    let blockEvent: BlockEvent = new TestBlockEventExtended().setDifficulty("1000").setNumber(blockNumber);

    for (let i = 0; i <= MOCK_NUMBER_OF_BLOCKS_TO_CHECK; i++) {
      when(mockProvider.getBlock)
        .calledWith(blockNumber - MOCK_NUMBER_OF_BLOCKS_TO_CHECK + i)
        .mockReturnValue({ _difficulty: TEST_BLOCK_DIFFICULTIES[i] });
    }

    let findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);

    blockNumber = blockNumber++;
    blockEvent = new TestBlockEventExtended().setDifficulty("1001").setNumber(blockNumber);

    findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if there is a unusual increase in block difficulty", async () => {
    let blockNumber = 205345;
    let blockEvent: BlockEvent = new TestBlockEventExtended().setDifficulty("1000").setNumber(blockNumber);

    for (let i = 0; i <= MOCK_NUMBER_OF_BLOCKS_TO_CHECK; i++) {
      when(mockProvider.getBlock)
        .calledWith(blockNumber - MOCK_NUMBER_OF_BLOCKS_TO_CHECK + i)
        .mockReturnValue({ _difficulty: TEST_BLOCK_DIFFICULTIES[i] });
    }

    let findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);

    blockNumber = blockNumber++;
    blockEvent = new TestBlockEventExtended().setDifficulty("6856876867001").setNumber(blockNumber);

    findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      createFinding("6856876867001", "1371375374196.2", "400", MOCK_THRESHOLD.toString(10)),
    ]);
  });

  it("should return a finding if there is a unusual decrease in block difficulty", async () => {
    let blockNumber = 305345;
    let blockEvent: BlockEvent = new TestBlockEventExtended().setDifficulty("1000").setNumber(blockNumber);

    for (let i = 0; i <= MOCK_NUMBER_OF_BLOCKS_TO_CHECK; i++) {
      when(mockProvider.getBlock)
        .calledWith(blockNumber - MOCK_NUMBER_OF_BLOCKS_TO_CHECK + i)
        .mockReturnValue({ _difficulty: TEST_BLOCK_DIFFICULTIES[i] });
    }

    let findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);

    blockNumber = blockNumber++;
    blockEvent = new TestBlockEventExtended().setDifficulty("1").setNumber(blockNumber);

    findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([createFinding("1", "796.2", "99.87", MOCK_THRESHOLD.toString(10))]);
  });

  it("should return no findings if the TTD has been reached", async () => {
    let blockNumber = 405345;
    let blockEvent: BlockEvent = new TestBlockEventExtended().setDifficulty("1000").setNumber(blockNumber);

    for (let i = 0; i <= MOCK_NUMBER_OF_BLOCKS_TO_CHECK; i++) {
      when(mockProvider.getBlock)
        .calledWith(blockNumber - MOCK_NUMBER_OF_BLOCKS_TO_CHECK + i)
        .mockReturnValue({ _difficulty: TEST_BLOCK_DIFFICULTIES[i] });
    }

    let findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);

    blockNumber = blockNumber++;
    blockEvent = new TestBlockEventExtended()
      .setDifficulty("1")
      .setTotalDifficulty("58750000000000000000000")
      .setNumber(blockNumber);

    findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });
});
