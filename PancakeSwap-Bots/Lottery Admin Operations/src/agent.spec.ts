import { HandleTransaction, createTransactionEvent } from "forta-agent";

import bot from "./agent";

describe("PancakeSwap Lottery", () => {
  let handleTransaction: HandleTransaction;

  const mockNewGeneratorBot = {
    handleTransaction: jest.fn(),
  };

  const mockNewOperatorBot = {
    handleTransaction: jest.fn(),
  };

  const mockFunctionCallBot = {
    handleTransaction: jest.fn(),
  };

  const mockTxEvent = createTransactionEvent({} as any);

  beforeAll(() => {
    handleTransaction = bot.provideHandleTransaction(
      mockNewGeneratorBot,
      mockNewOperatorBot,
      mockFunctionCallBot
    );
  });

  describe("handleTransaction", () => {
    it("returns findings if there are events emitted and function called ", async () => {
      mockTxEvent.filterLog = jest.fn().mockReturnValue([]);

      const mockNewGeneratorFinding = { event: "NewRandomGenerator" };
      const mockNewOperatorFinding = {
        event: "NewOperatorAndTreasuryAndInjectorAddresses",
      };
      const mockFunctionCallFinding = { function: "setMaxNumberTicketsPerBuy" };

      mockNewGeneratorBot.handleTransaction.mockReturnValueOnce([mockNewGeneratorFinding]);
      mockNewOperatorBot.handleTransaction.mockReturnValueOnce([mockNewOperatorFinding]);
      mockFunctionCallBot.handleTransaction.mockReturnValueOnce([mockFunctionCallFinding]);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([mockNewGeneratorFinding, mockNewOperatorFinding, mockFunctionCallFinding]);
      expect(mockNewGeneratorBot.handleTransaction).toHaveBeenCalledTimes(1);
      expect(mockNewGeneratorBot.handleTransaction).toHaveBeenCalledWith(mockTxEvent);

      expect(mockNewOperatorBot.handleTransaction).toHaveBeenCalledTimes(1);
      expect(mockNewOperatorBot.handleTransaction).toHaveBeenCalledWith(mockTxEvent);

      expect(mockFunctionCallBot.handleTransaction).toHaveBeenCalledTimes(1);
      expect(mockFunctionCallBot.handleTransaction).toHaveBeenCalledWith(mockTxEvent);
    });
  });
});
