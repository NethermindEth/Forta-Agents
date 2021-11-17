jest.useFakeTimers();
import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent,
  HandleBlock,
  createBlockEvent,
} from "forta-agent";
import { TestBlockEvent } from "forta-agent-tools";
import agent from "./agent";
import { buildWeb3, build_Mock } from "./contract.mock";
import { generateFinding } from "./utils";
import mockAxios from "./jest.mock";

describe("Yearn: Instant Withdraw Agent", () => {
  let handleBlock: HandleBlock;

  beforeEach(async () => {
    handleBlock = await agent.providerHandleBlock(
      buildWeb3() as any,
      mockAxios
    );
  });

  describe("Finding if withdraw possible", () => {
    it("If the withdraw is working, dont return any findings", async () => {
      const blockEvent = new TestBlockEvent();

      const findings = await handleBlock(blockEvent);

      expect(findings).toStrictEqual([]);
    });

    it(" If the withdraw is not working, return an alert", async () => {
      const blockEvent = new TestBlockEvent();

      const findings = await handleBlock(blockEvent);

      expect(findings).toStrictEqual([
        generateFinding(
          "1.85430576426855580035911211e+26",
          0,
          "0xda816459f1ab5631232fe5e97a05bbbb94970c95"
        ),
      ]);
    });
  });
});
