import { Finding, FindingSeverity, FindingType, HandleTransaction, createTransactionEvent, ethers, TransactionEvent } from "forta-agent";
import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests.utils";

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
      let randomG = createAddress("0x123")

      const eventLog = eventInterface.encodeEventLog(
        eventInterface.getEvent('NewRandomGenerator'),
        [
          randomG
        ]
      )
      
      mockTxEvent.addAnonymousEventLog(PANCAKE_SWAP_LOTTERY_ADDRESS, eventLog.data, ...eventLog.topics)
      
      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "New Random Generator",
          description: "PancakeSwapLottery: Random Number Generator changed",
          alertId: "CAKE-8-1",
          protocol: "PancakeSwap",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
            randomGenerator: randomG
          },
        }),
      ]);

    });

  });
});
