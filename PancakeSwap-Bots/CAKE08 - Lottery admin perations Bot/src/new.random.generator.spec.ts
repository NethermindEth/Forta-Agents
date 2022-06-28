import { Finding, FindingSeverity, FindingType, HandleTransaction, createTransactionEvent, ethers } from "forta-agent";

import agent from "./new.random.generator";
import { EVENTS, PANCAKE_SWAP_LOTTERY_ADDRESS } from "./agent.config";

describe("PancakeSwap Lottery", () => {
  let handleTransaction: HandleTransaction;
  const mockTxEvent = createTransactionEvent({} as any);

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  describe("NewRandomGenerator handleTransaction", () => {
    it("returns no findings if there are no NewRandomGenerator events emitted ", async () => {
      mockTxEvent.filterLog = jest.fn().mockReturnValue([]);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
      expect(mockTxEvent.filterLog).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterLog).toHaveBeenCalledWith(EVENTS.NewRandomGenerator, PANCAKE_SWAP_LOTTERY_ADDRESS);
    });

    it("returns findings if there are NewRandomGenerator events emitted ", async () => {
      const mockSwapEvent = {
        args: {
          to: "0x0123",
          from: "0x0abc",
          randomGenerator: "random generator",
        },
      };

      mockTxEvent.filterLog = jest.fn().mockReturnValue([mockSwapEvent]);

      const findings = await handleTransaction(mockTxEvent);

      const { randomGenerator } = mockSwapEvent.args;

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "New Random Generator",
          description: "PancakeSwapLottery: Random Number Generator changed",
          alertId: "CAKE-8-1",
          protocol: "PancakeSwap",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
            randomGenerator,
          },
        }),
      ]);
      expect(mockTxEvent.filterLog).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterLog).toHaveBeenCalledWith(EVENTS.NewRandomGenerator, PANCAKE_SWAP_LOTTERY_ADDRESS);
    });
  });
});
