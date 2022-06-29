import { HandleTransaction, ethers } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/tests.utils";

import { operator, treasury, injector, NEW_OPERATOR_TREASURY_INJECTOR_FINDING } from "./bot.test.constants";

import bot from "./new.operator.and.treasury.and.injector.address";
import { EVENTS, PANCAKE_SWAP_LOTTERY_ADDRESS } from "./bot.config";

describe("PancakeSwap Lottery", () => {
  let handleTransaction: HandleTransaction;
  let mockTxEvent: TestTransactionEvent;
  let eventInterface: ethers.utils.Interface;

  beforeEach(() => {
    mockTxEvent = new TestTransactionEvent();
  });

  beforeAll(() => {
    handleTransaction = bot.handleTransaction;
    eventInterface = new ethers.utils.Interface([EVENTS.NewOperatorAndTreasuryAndInjectorAddresses]);
  });

  describe("NewOperatorAndTreasuryAndInjectorAddresses handleTransaction", () => {
    it("returns no findings if there are no NewOperatorAndTreasuryAndInjectorAddresses events emitted ", async () => {
      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns finding if there is one NewOperatorAndTreasuryAndInjectorAddresses event emitted ", async () => {
      const eventLog = eventInterface.encodeEventLog(
        eventInterface.getEvent("NewOperatorAndTreasuryAndInjectorAddresses"),
        [operator, treasury, injector]
      );

      mockTxEvent.addAnonymousEventLog(PANCAKE_SWAP_LOTTERY_ADDRESS, eventLog.data, ...eventLog.topics);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([NEW_OPERATOR_TREASURY_INJECTOR_FINDING]);
    });

    it("returns findings if there are multiple NewOperatorAndTreasuryAndInjectorAddresses events emitted ", async () => {
      const eventLog = eventInterface.encodeEventLog(
        eventInterface.getEvent("NewOperatorAndTreasuryAndInjectorAddresses"),
        [operator, treasury, injector]
      );

      mockTxEvent.addAnonymousEventLog(PANCAKE_SWAP_LOTTERY_ADDRESS, eventLog.data, ...eventLog.topics);
      mockTxEvent.addAnonymousEventLog(PANCAKE_SWAP_LOTTERY_ADDRESS, eventLog.data, ...eventLog.topics);
      mockTxEvent.addAnonymousEventLog(PANCAKE_SWAP_LOTTERY_ADDRESS, eventLog.data, ...eventLog.topics);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        NEW_OPERATOR_TREASURY_INJECTOR_FINDING,
        NEW_OPERATOR_TREASURY_INJECTOR_FINDING,
        NEW_OPERATOR_TREASURY_INJECTOR_FINDING,
      ]);
    });

    it("returns no findings if the event emitted is not the correct one ", async () => {
      
      let wrongEventInterface = new ethers.utils.Interface(["event WrongEvent(uint256 x)"]);

      const eventLog = wrongEventInterface.encodeEventLog(wrongEventInterface.getEvent("WrongEvent"), [120]);
      mockTxEvent.addAnonymousEventLog(PANCAKE_SWAP_LOTTERY_ADDRESS, eventLog.data, ...eventLog.topics);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });
  });
});
