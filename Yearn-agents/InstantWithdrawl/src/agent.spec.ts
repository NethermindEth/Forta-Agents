import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent,
  HandleBlock,
  createBlockEvent,
} from "forta-agent";
import mockAxios from "jest-mock-axios";
import { TestBlockEvent } from "forta-agent-tools";
import agent from "./agent";
import { build_Mock, mockResponse } from "./mock";
import { generateFinding } from "./utils";

describe("Yearn: Instant Withdraw Agent", () => {
  let handleBlock: HandleBlock;

  beforeEach(async () => {
    const mockWeb3 = {
      eth: {
        Contract: build_Mock(),
      },
    };
    mockAxios.reset();
    handleBlock = await agent.providerHandleBlock(mockWeb3 as any, mockAxios);
  });

  describe("Finding if withdraw possible", () => {
    it("If the withdraw is working, dont return any findings", async () => {
      const blockEvent = new TestBlockEvent();

      // mockAxios.mockResponse(mockResponse);

      const findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([]);
    });

    it(" If the withdraw is not working, return an alert", async () => {
      const blockEvent = new TestBlockEvent();

      mockAxios.mockResponse(mockResponse);

      const findings = await handleBlock(blockEvent);
      expect(findings).toStrictEqual(
        generateFinding("185430576426855580035911211")
      );
    });
  });
});
