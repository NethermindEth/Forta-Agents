import { HandleTransaction, ethers } from "forta-agent";
import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests.utils";

import { MOCK_CONTRACT_ADDRESS } from "./bot.test.constants";

import bot from "./new.operator.and.treasury.and.injector.address";
import { EVENTS } from "./abi";
import { createEventFinding } from "./findings";

describe("PancakeSwap Lottery", () => {
  let handleTransaction: HandleTransaction;
  let mockTxEvent: TestTransactionEvent;
  let eventInterface: ethers.utils.Interface;

  const _name = "NewOperatorAndTreasuryAndInjectorAddresses";
  const _description = "Operator, Treasury and Injector Addresses changed";

  beforeEach(() => {
    mockTxEvent = new TestTransactionEvent();
  });

  beforeAll(() => {
    handleTransaction = bot.providerHandleTransaction(MOCK_CONTRACT_ADDRESS);
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
        [createAddress("0x1234"), createAddress("0x0321"), createAddress("0x3526")]
      );

      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog.data, ...eventLog.topics);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        createEventFinding(_name, _description, {
          operator: createAddress("0x1234"),
          treasury: createAddress("0x0321"),
          injector: createAddress("0x3526"),
        }),
      ]);
    });

    it("returns findings if there are multiple NewOperatorAndTreasuryAndInjectorAddresses events emitted ", async () => {
      const operator_1 = createAddress("0x1234");
      const treasury_1 = createAddress("0x5532");
      const injector_1 = createAddress("0x4567");
      const operator_2 = createAddress("0x4732");
      const treasury_2 = createAddress("0x0213");
      const injector_2 = createAddress("0x0718");
      const operator_3 = createAddress("0x1003");
      const treasury_3 = createAddress("0x0222");
      const injector_3 = createAddress("0x1892");

      const eventLog_1 = eventInterface.encodeEventLog(
        eventInterface.getEvent("NewOperatorAndTreasuryAndInjectorAddresses"),
        [operator_1, treasury_1, injector_1]
      );

      const eventLog_2 = eventInterface.encodeEventLog(
        eventInterface.getEvent("NewOperatorAndTreasuryAndInjectorAddresses"),
        [operator_2, treasury_2, injector_2]
      );

      const eventLog_3 = eventInterface.encodeEventLog(
        eventInterface.getEvent("NewOperatorAndTreasuryAndInjectorAddresses"),
        [operator_3, treasury_3, injector_3]
      );

      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog_1.data, ...eventLog_1.topics);
      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog_2.data, ...eventLog_2.topics);
      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog_3.data, ...eventLog_3.topics);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        createEventFinding(_name, _description, { operator: operator_1, treasury: treasury_1, injector: injector_1 }),
        createEventFinding(_name, _description, { operator: operator_2, treasury: treasury_2, injector: injector_2 }),
        createEventFinding(_name, _description, { operator: operator_3, treasury: treasury_3, injector: injector_3 }),
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
