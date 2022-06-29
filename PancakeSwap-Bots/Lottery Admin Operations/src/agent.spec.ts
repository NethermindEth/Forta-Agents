import { HandleTransaction, ethers, Finding } from "forta-agent";
import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests";

import {
  NEW_RANDOM_GENERATOR_FINDING,
  NEW_OPERATOR_TREASURY_INJECTOR_FINDING,
  SET_MIN_MAX_TICKET_PRICE_CAKE_FINDING,
  SET_MAX_NUMBER_TICKETS_PER_BUY_FINDING,
  randomGenerator,
  operator,
  treasury,
  injector,
} from "./bot.test.constants";

import bot from "./agent";

import { EVENTS, ABI, PANCAKE_SWAP_LOTTERY_ADDRESS, FUNCTION_NAMES } from "./bot.config";

describe("PancakeSwap Lottery", () => {
  let handleTransaction: HandleTransaction;

  let eventInterface: ethers.utils.Interface;

  let functionInterface: ethers.utils.Interface;

  let eventLog_1: { data: any; topics: any };
  let eventLog_2: { data: any; topics: any };

  let mockTxEvent: TestTransactionEvent;

  beforeEach(() => {
    mockTxEvent = new TestTransactionEvent();
  });

  beforeAll(() => {
    handleTransaction = bot.handleTransaction;

    eventInterface = new ethers.utils.Interface([
      EVENTS.NewRandomGenerator,
      EVENTS.NewOperatorAndTreasuryAndInjectorAddresses,
    ]);

    functionInterface = new ethers.utils.Interface(ABI);

    eventLog_1 = eventInterface.encodeEventLog(eventInterface.getEvent("NewRandomGenerator"), [randomGenerator]);

    eventLog_2 = eventInterface.encodeEventLog(eventInterface.getEvent("NewOperatorAndTreasuryAndInjectorAddresses"), [
      operator,
      treasury,
      injector,
    ]);
  });

  describe("handleTransaction", () => {
    it("returns empty findings if no events is emitted or function called", async () => {
      mockTxEvent.addAnonymousEventLog(PANCAKE_SWAP_LOTTERY_ADDRESS, "", ...[]);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if it has the wrong contract address", async () => {
      mockTxEvent.addAnonymousEventLog(createAddress("0xabc"), eventLog_1.data, ...eventLog_1.topics);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns finding if function is called", async () => {
      const data = functionInterface.encodeFunctionData(FUNCTION_NAMES[1], [10]);
      mockTxEvent.setData(data).setTo(PANCAKE_SWAP_LOTTERY_ADDRESS);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([SET_MAX_NUMBER_TICKETS_PER_BUY_FINDING]);
    });

    it("returns findings with events emitted", async () => {
      mockTxEvent.addAnonymousEventLog(PANCAKE_SWAP_LOTTERY_ADDRESS, eventLog_1.data, ...eventLog_1.topics);
      mockTxEvent.addAnonymousEventLog(PANCAKE_SWAP_LOTTERY_ADDRESS, eventLog_2.data, ...eventLog_2.topics);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([NEW_RANDOM_GENERATOR_FINDING, NEW_OPERATOR_TREASURY_INJECTOR_FINDING]);
    });

    it("returns findings with Event and Function call alerts", async () => {
      mockTxEvent.addAnonymousEventLog(PANCAKE_SWAP_LOTTERY_ADDRESS, eventLog_1.data, ...eventLog_1.topics);
      mockTxEvent.addAnonymousEventLog(PANCAKE_SWAP_LOTTERY_ADDRESS, eventLog_2.data, ...eventLog_2.topics);

      //encode data into mockTxEvent to simulate function call
      const data = functionInterface.encodeFunctionData(FUNCTION_NAMES[0], [100000, 200000]);
      mockTxEvent.setData(data).setTo(PANCAKE_SWAP_LOTTERY_ADDRESS);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        NEW_RANDOM_GENERATOR_FINDING,
        NEW_OPERATOR_TREASURY_INJECTOR_FINDING,
        SET_MIN_MAX_TICKET_PRICE_CAKE_FINDING,
      ]);
    });
  });
});
