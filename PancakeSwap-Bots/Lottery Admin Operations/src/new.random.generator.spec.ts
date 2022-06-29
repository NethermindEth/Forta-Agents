import {  HandleTransaction, ethers } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/tests.utils";

import {
  NEW_RANDOM_GENERATOR_FINDING,
  randomGenerator
} 
from "./bot.test.constants"

import agent from "./new.random.generator";
import { EVENTS, PANCAKE_SWAP_LOTTERY_ADDRESS } from "./bot.config";

describe("PancakeSwap Lottery", () => {
  let handleTransaction: HandleTransaction;
  let mockTxEvent: TestTransactionEvent = new TestTransactionEvent();

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  describe("NewRandomGenerator handleTransaction", () => {
    it("returns no findings if there are no NewRandomGenerator events emitted ", async () => {

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns findings if there are NewRandomGenerator events emitted ", async () => {
      

      let eventInterface = new ethers.utils.Interface([EVENTS.NewRandomGenerator])

      const eventLog = eventInterface.encodeEventLog(
        eventInterface.getEvent('NewRandomGenerator'),
        [
          randomGenerator
        ]
        
      )
      
      mockTxEvent.addAnonymousEventLog(PANCAKE_SWAP_LOTTERY_ADDRESS, eventLog.data, ...eventLog.topics)
      
      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([NEW_RANDOM_GENERATOR_FINDING]);

    });

  });
});
