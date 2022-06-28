import { Finding, FindingType, FindingSeverity, HandleTransaction, ethers } from "forta-agent";
import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests.utils";

import agent from "./new.operator.and.treasury.and.injector.address";
import { EVENTS, PANCAKE_SWAP_LOTTERY_ADDRESS } from "./bot.config";

describe("PancakeSwap Lottery", () => {
  let handleTransaction: HandleTransaction;
  let mockTxEvent: TestTransactionEvent = new TestTransactionEvent();

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  describe("NewOperatorAndTreasuryAndInjectorAddresses handleTransaction", () => {
    it("returns no findings if there are no NewOperatorAndTreasuryAndInjectorAddresses events emitted ", async () => {

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);

    });

    it("returns findings if there are NewOperatorAndTreasuryAndInjectorAddresses events emitted ", async () => {

      let eventInterface = new ethers.utils.Interface([EVENTS.NewOperatorAndTreasuryAndInjectorAddresses])
      let operator = createAddress("0x0123")
      let treasury = createAddress("0x0456")
      let injector = createAddress("0x0789")

      const eventLog = eventInterface.encodeEventLog(
        eventInterface.getEvent('NewOperatorAndTreasuryAndInjectorAddresses'),
        [
          operator,
          treasury,
          injector
        ]
      )
      
      mockTxEvent.addAnonymousEventLog(PANCAKE_SWAP_LOTTERY_ADDRESS, eventLog.data, ...eventLog.topics)

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "New Operator And Treasury And Injector Addresses",
          description: "PancakeSwapLottery: New Operator And Treasury And Injector Addresses",
          alertId: "CAKE-8-2",
          protocol: "PancakeSwap",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
            operator,
            treasury,
            injector
          },
        }),
      ]);

    });
  });
});
