import { Finding, FindingType, FindingSeverity, HandleTransaction, createTransactionEvent } from "forta-agent";

import agent from "./function.call.listener";
import { ABI, PANCAKE_SWAP_LOTTERY_ADDRESS } from "./agent.config";

describe("PancakeSwap Lottery", () => {
  let handleTransaction: HandleTransaction;
  const mockTxEvent = createTransactionEvent({} as any);

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  describe("Function Calls handleTransaction", () => {
    it("returns no findings if there are no function calls", async () => {
      mockTxEvent.filterFunction = jest.fn().mockReturnValue([]);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
      expect(mockTxEvent.filterFunction).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterFunction).toHaveBeenCalledWith(ABI, PANCAKE_SWAP_LOTTERY_ADDRESS);
    });

    it("returns findings if there are function calls for the specified ABI", async () => {
      const mockSwapEvent = {
        name: "setMaxNumberTicketsPerBuy",
      };

      mockTxEvent.filterFunction = jest.fn().mockReturnValue([mockSwapEvent]);

      const findings = await handleTransaction(mockTxEvent);

      const name = mockSwapEvent.name;

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Function Call",
          description: `Function called: ${name}`,
          alertId: "FORTA-3",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {},
        }),
      ]);
      expect(mockTxEvent.filterFunction).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterFunction).toHaveBeenCalledWith(ABI, PANCAKE_SWAP_LOTTERY_ADDRESS);
    });
  });
});
