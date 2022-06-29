import { Finding, HandleTransaction, ethers } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/tests.utils";

import { SET_MIN_MAX_TICKET_PRICE_CAKE_FINDING, SET_MAX_NUMBER_TICKETS_PER_BUY_FINDING } from "./bot.test.constants";

import bot from "./function.call.listener";
import { ABI, PANCAKE_SWAP_LOTTERY_ADDRESS, FUNCTION_NAMES } from "./bot.config";

describe("PancakeSwap Lottery", () => {
  let handleTransaction: HandleTransaction;
  let mockTxEvent: TestTransactionEvent;

  let functionInterface: ethers.utils.Interface;

  beforeEach(() => {
    mockTxEvent = new TestTransactionEvent();
  });

  beforeAll(() => {
    handleTransaction = bot.handleTransaction;
    functionInterface = new ethers.utils.Interface(ABI);
  });

  describe("Function Calls handleTransaction", () => {
    it("returns no findings if no function called", async () => {
      const data = "0x000";
      mockTxEvent.setData(data).setTo(PANCAKE_SWAP_LOTTERY_ADDRESS);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns findings if function setMinAndMaxTicketPriceInCake is called", async () => {
      const data = functionInterface.encodeFunctionData(FUNCTION_NAMES[0], [100000, 200000]);
      mockTxEvent.setData(data).setTo(PANCAKE_SWAP_LOTTERY_ADDRESS);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([SET_MIN_MAX_TICKET_PRICE_CAKE_FINDING]);
    });

    it("returns findings if function setMaxNumberTicketsPerBuy is called", async () => {
      const data = functionInterface.encodeFunctionData(FUNCTION_NAMES[1], [10]);
      mockTxEvent.setData(data).setTo(PANCAKE_SWAP_LOTTERY_ADDRESS);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([SET_MAX_NUMBER_TICKETS_PER_BUY_FINDING]);
    });
  });
});
