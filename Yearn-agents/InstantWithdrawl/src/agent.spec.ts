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
import { build_Mock } from "./contract.mock";
import { generateFinding } from "./utils";
import mockAxios from "./jest.mock";

describe("Yearn: Instant Withdraw Agent", () => {
  let handleBlock: HandleBlock;

  beforeEach(async () => {
    const mockWeb3 = {
      eth: {
        Contract: build_Mock(),
      },
    };

    handleBlock = await agent.providerHandleBlock(mockWeb3 as any, mockAxios);
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

      expect(findings).toStrictEqual(
        generateFinding("185430576426855580035911211", 20)
      );
    });
  });
});
