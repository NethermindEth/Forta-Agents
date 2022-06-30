import { Finding, HandleTransaction, ethers } from "forta-agent";
import { TestTransactionEvent, TraceProps } from "forta-agent-tools/lib/tests.utils";

import { FUNCTION_NAMES, MOCK_CONTRACT_ADDRESS } from "./bot.test.constants";

import bot from "./function.call.listener";
import { ABI } from "./abi";
import { createFunctionFinding } from "./findings";

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
      const data = "0x0000";
      mockTxEvent.setData(data).setTo(MOCK_CONTRACT_ADDRESS);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns finding if function setMinAndMaxTicketPriceInCake is called", async () => {
      const data = functionInterface.encodeFunctionData(FUNCTION_NAMES[0], [100000, 200000]);
      mockTxEvent.setData(data).setTo(MOCK_CONTRACT_ADDRESS);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        createFunctionFinding(FUNCTION_NAMES[0], FUNCTION_NAMES[0], {
          _minPriceTicketInCake: "100000",
          _maxPriceTicketInCake: "200000",
        }),
      ]);
    });

    it("returns finding if function setMaxNumberTicketsPerBuy is called", async () => {
      const data = functionInterface.encodeFunctionData(FUNCTION_NAMES[1], [10]);
      mockTxEvent.setData(data).setTo(MOCK_CONTRACT_ADDRESS);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        createFunctionFinding(FUNCTION_NAMES[1], FUNCTION_NAMES[1], { _maxNumberTicketsPerBuy: "10" }),
      ]);
    });

    it("returns multiple findings if more than one function is called", async () => {
      const data_1 = functionInterface.encodeFunctionData(FUNCTION_NAMES[0], [100000, 200000]);
      const data_2 = functionInterface.encodeFunctionData(FUNCTION_NAMES[1], [10]);

      const traces: TraceProps[] = [
        { to: MOCK_CONTRACT_ADDRESS, input: data_1 },
        { to: MOCK_CONTRACT_ADDRESS, input: data_2 },
      ];
      mockTxEvent.addTraces(...traces);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        createFunctionFinding(FUNCTION_NAMES[0], FUNCTION_NAMES[0], {
          _minPriceTicketInCake: "100000",
          _maxPriceTicketInCake: "200000",
        }),
        createFunctionFinding(FUNCTION_NAMES[1], FUNCTION_NAMES[1], { _maxNumberTicketsPerBuy: "10" }),
      ]);
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
