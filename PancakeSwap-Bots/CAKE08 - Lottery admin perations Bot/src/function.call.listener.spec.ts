import { Finding, FindingType, FindingSeverity, HandleTransaction, createTransactionEvent } from "forta-agent";

import bot from "./function.call.listener";
import { ABI, PANCAKE_SWAP_LOTTERY_ADDRESS } from "./bot.config";

describe("PancakeSwap Lottery", () => {
  let handleTransaction: HandleTransaction;
  const mockTxEvent = createTransactionEvent({} as any);

  beforeAll(() => {
    handleTransaction = bot.handleTransaction;
  });

  describe("Function Calls handleTransaction", () => {
    it("returns no findings if no function called", async () => {
      mockTxEvent.filterFunction = jest.fn().mockReturnValue([]);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
      expect(mockTxEvent.filterFunction).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterFunction).toHaveBeenCalledWith(ABI, PANCAKE_SWAP_LOTTERY_ADDRESS);
    });

    it("returns findings if function setMinAndMaxTicketPriceInCake is called", async () => {
      const mockSwapEvent = {
        args: {
          _minPriceTicketInCake: "1000000",
          _maxPriceTicketInCake: "2000000",
        },
        name: "setMinAndMaxTicketPriceInCake",
      };

      mockTxEvent.filterFunction = jest.fn().mockReturnValue([mockSwapEvent]);

      const findings = await handleTransaction(mockTxEvent);

      const name = mockSwapEvent.name;

      const { _minPriceTicketInCake, _maxPriceTicketInCake } = mockSwapEvent.args;

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Function Call",
          description: `PancakeSwapLottery: ${name}`,
          alertId: "CAKE-8-3",
          protocol: "PancakeSwap",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
            _minPriceTicketInCake,
            _maxPriceTicketInCake,
          },
        }),
      ]);
      expect(mockTxEvent.filterFunction).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterFunction).toHaveBeenCalledWith(ABI, PANCAKE_SWAP_LOTTERY_ADDRESS);
    });

    it("returns findings if function setMaxNumberTicketsPerBuy is called", async () => {
      const mockSwapEvent = {
        args: {
          _maxNumberTicketsPerBuy: "10",
        },
        name: "setMaxNumberTicketsPerBuy",
      };

      mockTxEvent.filterFunction = jest.fn().mockReturnValue([mockSwapEvent]);

      const findings = await handleTransaction(mockTxEvent);

      const name = mockSwapEvent.name;

      const { _maxNumberTicketsPerBuy } = mockSwapEvent.args;

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Function Call",
          description: `PancakeSwapLottery: ${name}`,
          alertId: "CAKE-8-3",
          protocol: "PancakeSwap",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
            _maxNumberTicketsPerBuy,
          },
        }),
      ]);
      expect(mockTxEvent.filterFunction).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterFunction).toHaveBeenCalledWith(ABI, PANCAKE_SWAP_LOTTERY_ADDRESS);
    });
  });
});
