import { Finding, HandleTransaction, ethers } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/tests.utils";

import {
  SET_MIN_MAX_TICKET_PRICE_CAKE_FINDING,
  SET_MAX_NUMBER_TICKETS_PER_BUY_FINDING,
  MOCK_CONTRACT_ADDRESS,
} from "./bot.test.constants";

import bot from "./function.call.listener";
import { ABI, FUNCTION_NAMES } from "./bot.config";

describe("PancakeSwap Lottery", () => {
  let handleTransaction: HandleTransaction;
  let mockTxEvent: TestTransactionEvent;

  let functionInterface: ethers.utils.Interface;

  beforeEach(() => {
    mockTxEvent = new TestTransactionEvent();
  });

  beforeAll(() => {
    handleTransaction = bot.providerHandleTransaction(MOCK_CONTRACT_ADDRESS);
    functionInterface = new ethers.utils.Interface(ABI);
  });

  describe("Function Calls handleTransaction", () => {
    it("returns no findings if no function called", async () => {
      const data = "0x000";
      mockTxEvent.setData(data).setTo(MOCK_CONTRACT_ADDRESS);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns findings if function setMinAndMaxTicketPriceInCake is called", async () => {
      const data = functionInterface.encodeFunctionData(FUNCTION_NAMES[0], [100000, 200000]);
      mockTxEvent.setData(data).setTo(MOCK_CONTRACT_ADDRESS);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([SET_MIN_MAX_TICKET_PRICE_CAKE_FINDING]);
    });

    it("returns findings if function setMaxNumberTicketsPerBuy is called", async () => {
      const data = functionInterface.encodeFunctionData(FUNCTION_NAMES[1], [10]);
      mockTxEvent.setData(data).setTo(MOCK_CONTRACT_ADDRESS);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([SET_MAX_NUMBER_TICKETS_PER_BUY_FINDING]);
    });

    it("returns empty findings if the function called is not the correct one", async () => {
      let wrongFunctionInterface = new ethers.utils.Interface(["function wrongFunction(uint256 x)"]);

      const data = wrongFunctionInterface.encodeFunctionData("wrongFunction", [10]);
      mockTxEvent.setData(data).setTo(MOCK_CONTRACT_ADDRESS);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });
  });
});
