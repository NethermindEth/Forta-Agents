import { HandleTransaction, ethers } from "forta-agent";
import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests.utils";

import { MOCK_CONTRACT_ADDRESS } from "./bot.test.constants";

import bot from "./new.random.generator";
import { EVENTS } from "./abi";
import { createEventFinding } from "./findings";

describe("PancakeSwap Lottery", () => {
  let handleTransaction: HandleTransaction;
  let mockTxEvent: TestTransactionEvent;
  let eventInterface: ethers.utils.Interface;

  const _name = "NewRandomGenerator";
  const _description = "Random Generator Address changed";

  beforeEach(() => {
    mockTxEvent = new TestTransactionEvent();
  });

  beforeAll(() => {
    handleTransaction = bot.providerHandleTransaction(MOCK_CONTRACT_ADDRESS);
    eventInterface = new ethers.utils.Interface([EVENTS.NewRandomGenerator]);
  });

  describe("NewRandomGenerator handleTransaction", () => {
    it("returns no findings if there are no NewRandomGenerator events emitted ", async () => {
      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns findings if there are NewRandomGenerator events emitted ", async () => {
      const eventLog = eventInterface.encodeEventLog(eventInterface.getEvent("NewRandomGenerator"), [
        createAddress("0x1234"),
      ]);

      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog.data, ...eventLog.topics);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        createEventFinding(_name, _description, { randomGenerator: createAddress("0x1234") }),
      ]);
    });

    it("returns findings if there are multiple NewRandomGenerator events emitted ", async () => {
      const randomGenerator_1 = createAddress("0x1234");
      const randomGenerator_2 = createAddress("0x1235");
      const randomGenerator_3 = createAddress("0x1236");

      const eventLog_1 = eventInterface.encodeEventLog(eventInterface.getEvent("NewRandomGenerator"), [
        randomGenerator_1,
      ]);
      const eventLog_2 = eventInterface.encodeEventLog(eventInterface.getEvent("NewRandomGenerator"), [
        randomGenerator_2,
      ]);
      const eventLog_3 = eventInterface.encodeEventLog(eventInterface.getEvent("NewRandomGenerator"), [
        randomGenerator_3,
      ]);

      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog_1.data, ...eventLog_1.topics);
      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog_2.data, ...eventLog_2.topics);
      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog_3.data, ...eventLog_3.topics);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        createEventFinding(_name, _description, { randomGenerator: randomGenerator_1 }),
        createEventFinding(_name, _description, { randomGenerator: randomGenerator_2 }),
        createEventFinding(_name, _description, { randomGenerator: randomGenerator_3 }),
      ]);
    });

    it("returns no findings if the event emitted is not the correct one ", async () => {
      let wrongEventInterface = new ethers.utils.Interface(["event WrongEvent(uint256 x)"]);

      const eventLog = wrongEventInterface.encodeEventLog(wrongEventInterface.getEvent("WrongEvent"), [120]);
      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog.data, ...eventLog.topics);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });
  });
});
