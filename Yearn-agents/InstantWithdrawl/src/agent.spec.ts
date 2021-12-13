jest.useFakeTimers();
import { HandleBlock } from "forta-agent";
import { TestBlockEvent } from "forta-agent-tools";
import agent from "./agent";
import {
  buildWeb3Mock,
  mockWithdrawBalance,
  mockCallBalance,
} from "./contract.mock";
import { generateFinding } from "./utils";
import mockAxios, { generateMockResponseArray } from "./jest.mock";
import BigNumber from "bignumber.js";

describe("Yearn: Instant Withdraw Agent", () => {
  let handleBlock: HandleBlock;

  beforeEach(async () => {
    handleBlock = await agent.providerHandleBlock(
      buildWeb3Mock() as any,
      mockAxios
    );
  });

  describe("Finding if withdraw possible", () => {
    it("Account withdraws: If the withdraw is working, dont return any findings. The returned vault is a success promise for account.", async () => {
      const blockEvent = new TestBlockEvent();

      mockAxios.mockResolvedValueOnce(
        generateMockResponseArray([
          {
            vault: "0x59518884eebfb03e90a18adbaaab770d4666471e",
            id: "0xfdcd5daf992a68f297647074221cf51a3c23e4ed",
            balanceShares: "289584189215485306814849565",
          },
        ])
      );

      mockWithdrawBalance.mockImplementationOnce(() =>
        Promise.resolve("success")
      );

      mockCallBalance.mockImplementationOnce(() =>
        Promise.resolve("289584189215485306814849565")
      );
      const findings = await handleBlock(blockEvent);

      expect(findings).toStrictEqual([]);
    });

    it("Another account withdraws: If the withdraw is not working, return an alert. The overall liquidity in the vault decreased because of the previous withdrawl, resulting in Promise rejection", async () => {
      const blockEvent = new TestBlockEvent();

      mockAxios.mockResolvedValueOnce(
        generateMockResponseArray([
          {
            vault: "0x59518884eebfb03e90a18adbaaab770d4666471e",
            id: "0x224d5daf992a68f297647074221cf51a3c23e4ed",
            balanceShares: "289584189215485306814849565",
          },
        ])
      );

      mockWithdrawBalance.mockImplementationOnce(() => Promise.resolve());

      mockCallBalance.mockImplementationOnce(() =>
        Promise.resolve("189584189215485306814849565")
      );
      const findings = await handleBlock(blockEvent);

      expect(findings).toStrictEqual([
        generateFinding(
          new BigNumber("189584189215485306814849565"),
          new BigNumber("289584189215485306814849565"),
          0,
          "0x59518884eebfb03e90a18adbaaab770d4666471e"
        ),
      ]);
    });

    it("Multiple account withdraw on a vault: If the withdraw is not working, return an alert. The agent for with an array of addresses", async () => {
      const blockEvent = new TestBlockEvent();

      mockAxios.mockResolvedValueOnce(
        generateMockResponseArray([
          {
            vault: "0x59518884eebfb03e90a18adbaaab770d4666471e",
            id: "0xfdcd5daf992a68f297647074221cf51a3c23e4ed", // this account will get it withdrawl done
            balanceShares: "289584189215485306814849565",
          },
          {
            vault: "0x59518884eebfb03e90a18adbaaab770d4666471e",
            id: "0xcccd5daf992a68f297647074221cf51a3c23e4ed", // this one wont be able to make the withdraw
            balanceShares: "149584189215485306814849565",
          },
        ])
      );

      mockWithdrawBalance.mockImplementationOnce(() => Promise.resolve());
      mockWithdrawBalance.mockImplementationOnce(() => Promise.resolve());

      mockCallBalance.mockImplementationOnce(() =>
        Promise.resolve("289584189215485306814849565")
      );
      mockCallBalance.mockImplementationOnce(() =>
        Promise.resolve("129584189215485306814849565")
      );

      const findings = await handleBlock(blockEvent);

      expect(findings).toStrictEqual([
        generateFinding(
          new BigNumber("129584189215485306814849565"),
          new BigNumber("149584189215485306814849565"),
          1,
          "0x59518884eebfb03e90a18adbaaab770d4666471e"
        ),
      ]);
    });
  });
});
