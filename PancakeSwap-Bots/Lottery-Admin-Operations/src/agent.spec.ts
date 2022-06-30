import { HandleTransaction, ethers, Finding } from "forta-agent";
import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests";
import { NetworkManager } from "forta-agent-tools";

import { FUNCTION_NAMES, MOCK_CONTRACT_ADDRESS } from "./bot.test.constants";

import bot from "./agent";

import { EVENTS, ABI } from "./abi";
import { createEventFinding, createFunctionFinding } from "./findings";

describe("PancakeSwap Lottery", () => {
  let handleTransaction: HandleTransaction;

  let eventInterface: ethers.utils.Interface;

  let functionInterface: ethers.utils.Interface;

  let eventLog_1: { data: any; topics: any };
  let eventLog_2: { data: any; topics: any };

  let mockTxEvent: TestTransactionEvent;

  interface NetworkData {
    lotteryAddress: string;
  }

  let networkManager: NetworkManager<NetworkData>;

  beforeEach(() => {
    mockTxEvent = new TestTransactionEvent();
  });

  beforeAll(() => {
    const mockData: Record<number, NetworkData> = {
      56: {
        lotteryAddress: MOCK_CONTRACT_ADDRESS,
      },
    };

    networkManager = new NetworkManager(mockData, 56);
    handleTransaction = bot.provideHandleTransaction(networkManager);

    eventInterface = new ethers.utils.Interface([
      EVENTS.NewRandomGenerator,
      EVENTS.NewOperatorAndTreasuryAndInjectorAddresses,
    ]);

    functionInterface = new ethers.utils.Interface(ABI);

    eventLog_1 = eventInterface.encodeEventLog(eventInterface.getEvent("NewRandomGenerator"), [
      createAddress("0x2314"),
    ]);

    eventLog_2 = eventInterface.encodeEventLog(eventInterface.getEvent("NewOperatorAndTreasuryAndInjectorAddresses"), [
      createAddress("0x0123"),
      createAddress("0x0124"),
      createAddress("0x0125"),
    ]);
  });

  describe("handleTransaction", () => {
    it("returns empty findings if no event is emitted or function called", async () => {
      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, "", ...[]);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if the event emitted does not come from the correct contract address", async () => {
      mockTxEvent.addAnonymousEventLog(createAddress("0x5647"), eventLog_1.data, ...eventLog_1.topics);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns finding if function is called", async () => {
      const data = functionInterface.encodeFunctionData(FUNCTION_NAMES[1], [10]);
      mockTxEvent.setData(data).setTo(MOCK_CONTRACT_ADDRESS);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        createFunctionFinding(FUNCTION_NAMES[1], FUNCTION_NAMES[1], { _maxNumberTicketsPerBuy: "10" }),
      ]);
    });

    it("returns findings with events emitted", async () => {
      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog_1.data, ...eventLog_1.topics);
      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog_2.data, ...eventLog_2.topics);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        createEventFinding("NewRandomGenerator", "Random Generator Address changed", {
          randomGenerator: createAddress("0x2314"),
        }),
        createEventFinding(
          "NewOperatorAndTreasuryAndInjectorAddresses",
          "Operator, Treasury and Injector Addresses changed",
          { operator: createAddress("0x0123"), treasury: createAddress("0x0124"), injector: createAddress("0x0125") }
        ),
      ]);
    });

    it("returns findings with Event and Function call alerts", async () => {
      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog_1.data, ...eventLog_1.topics);
      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, eventLog_2.data, ...eventLog_2.topics);

      //encode data into mockTxEvent to simulate function call
      const data = functionInterface.encodeFunctionData(FUNCTION_NAMES[0], [100000, 200000]);
      mockTxEvent.setData(data).setTo(MOCK_CONTRACT_ADDRESS);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        createEventFinding("NewRandomGenerator", "Random Generator Address changed", {
          randomGenerator: createAddress("0x2314"),
        }),
        createEventFinding(
          "NewOperatorAndTreasuryAndInjectorAddresses",
          "Operator, Treasury and Injector Addresses changed",
          { operator: createAddress("0x0123"), treasury: createAddress("0x0124"), injector: createAddress("0x0125") }
        ),
        createFunctionFinding(FUNCTION_NAMES[0], FUNCTION_NAMES[0], {
          _minPriceTicketInCake: "100000",
          _maxPriceTicketInCake: "200000",
        }),
      ]);
    });
  });
});
