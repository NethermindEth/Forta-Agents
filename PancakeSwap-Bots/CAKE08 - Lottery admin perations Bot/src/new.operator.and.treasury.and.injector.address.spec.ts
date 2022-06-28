import { Finding, FindingType, FindingSeverity, HandleTransaction, createTransactionEvent } from "forta-agent";

import agent from "./new.operator.and.treasury.and.injector.address";
import { EVENTS, PANCAKE_SWAP_LOTTERY_ADDRESS } from "./bot.config";

describe("PancakeSwap Lottery", () => {
  let handleTransaction: HandleTransaction;
  const mockTxEvent = createTransactionEvent({} as any);

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  describe("NewOperatorAndTreasuryAndInjectorAddresses handleTransaction", () => {
    it("returns no findings if there are no NewOperatorAndTreasuryAndInjectorAddresses events emitted ", async () => {
      mockTxEvent.filterLog = jest.fn().mockReturnValue([]);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
      expect(mockTxEvent.filterLog).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterLog).toHaveBeenCalledWith(
        EVENTS.NewOperatorAndTreasuryAndInjectorAddresses,
        PANCAKE_SWAP_LOTTERY_ADDRESS
      );
    });

    it("returns findings if there are NewOperatorAndTreasuryAndInjectorAddresses events emitted ", async () => {
      const mockSwapEvent = {
        args: {
          operator: "0x0123",
          treasury: "0x0def",
          injector: "0x0456",
        },
      };

      mockTxEvent.filterLog = jest.fn().mockReturnValue([mockSwapEvent]);

      const findings = await handleTransaction(mockTxEvent);

      const { operator, treasury, injector } = mockSwapEvent.args;

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "New Operator And Treasury And Injector Addresses",
          description: "PancakeSwapLottery: New Operator And Treasury And Injector Addresses",
          alertId: "CAKE-8-2",
          protocol: "PancakeSwap",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
            operator,
            treasury,
            injector,
          },
        }),
      ]);
      expect(mockTxEvent.filterLog).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterLog).toHaveBeenCalledWith(
        EVENTS.NewOperatorAndTreasuryAndInjectorAddresses,
        PANCAKE_SWAP_LOTTERY_ADDRESS
      );
    });
  });
});
