jest.useFakeTimers();
import { HandleBlock } from "forta-agent";
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
    it("Account withdraws: If the withdraw is working, dont return any findings", async () => {
      const blockEvent = new TestBlockEvent();

      const findings = await handleBlock(blockEvent);

      expect(findings).toStrictEqual([]);
    });

    it("Another account withdraws: If the withdraw is not working, return an alert", async () => {
      const blockEvent = new TestBlockEvent();

      const findings = await handleBlock(blockEvent);

      expect(findings).toStrictEqual([
        generateFinding(
          "2.89584189215485306814849565e+26",
          0,
          "0x59518884eebfb03e90a18adbaaab770d4666471e"
        ),
      ]);
    });

    it("Another account withdraws: If the withdraw is not working, return an alert", async () => {
      const blockEvent = new TestBlockEvent();

      const findings = await handleBlock(blockEvent);

      expect(findings).toStrictEqual([
        generateFinding(
          "1.49584189215485306814849565e+26",
          1,
          "0x59518884eebfb03e90a18adbaaab770d4666471e"
        ),
      ]);
    });
  });
});
