import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  HandleBlock,
  createTransactionEvent
} from "forta-agent";
import {
  createAddress,
  TestBlockEvent
} from "forta-agent-tools";
import {
  provideHandleBlock
} from "./agent";

const testRealitioErc20: string = createAddress("0x2d5ef8");
const testDaoModule: string = createAddress("0xac689d");

describe("high gas agent", () => {
  let handleBlock: HandleBlock;

  beforeAll(() => {
    handleBlock = provideHandleBlock(
      testRealitioErc20,
      testDaoModule
    )
  })

  it("should return a Finding from detecting when a question's cooldown starts", async () => {
    /*
    const blockEvent = new TestBlockEvent().setNumber(25);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
    */
  });
})
