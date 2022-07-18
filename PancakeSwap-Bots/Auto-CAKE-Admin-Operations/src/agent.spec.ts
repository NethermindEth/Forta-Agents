import { HandleTransaction, ethers, Finding } from "forta-agent";
import { TestTransactionEvent, createAddress, TraceProps } from "forta-agent-tools/lib/tests";
import { NetworkManager } from "forta-agent-tools";


import bot from "./agent";

import { EVENTS, ABI } from "./abi";
import { createEventFinding, createFunctionFinding } from "./findings";

describe("CakeVault", () => {
  let handleTransaction: HandleTransaction;

  let eventInterface: ethers.utils.Interface;

  let functionInterface: ethers.utils.Interface;

  let mockTxEvent: TestTransactionEvent;

  const MOCK_CONTRACT_ADDRESS = createAddress("0x0123");

  let mockEventFragment: ethers.utils.EventFragment;
  let eventFragments: ethers.utils.EventFragment[] = [];
  let functionFragments: ethers.utils.FunctionFragment[] = [];

  interface NetworkData {
    cakeVaultAddress: string;
  }

  let networkManager: NetworkManager<NetworkData>;

  beforeEach(() => {
    mockTxEvent = new TestTransactionEvent();
  });


  beforeAll(() => {
    const mockData: Record<number, NetworkData> = {
      111: {
        cakeVaultAddress: MOCK_CONTRACT_ADDRESS,
      },
    };

    networkManager = new NetworkManager(mockData, 111);
    handleTransaction = bot.provideHandleTransaction(networkManager);

    eventInterface = new ethers.utils.Interface(EVENTS);

    functionInterface = new ethers.utils.Interface(ABI);

    EVENTS.forEach((event) => {
      eventFragments.push(ethers.utils.EventFragment.fromString(event.slice("event ".length)))
    });

    ABI.forEach((func) => {
      functionFragments.push(ethers.utils.FunctionFragment.fromString(func.slice("function ".length)))
    });

    mockEventFragment = ethers.utils.EventFragment.from("MockEvent(uint256)");
  
  });


  describe("handleTransaction", () => {
    it("returns empty findings if no event is emitted or function called", async () => {
      mockTxEvent.addAnonymousEventLog(MOCK_CONTRACT_ADDRESS, "", ...[]);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if the event emitted does not come from the correct contract address", async () => {

      mockTxEvent.addInterfaceEventLog(eventFragments[0], createAddress("0x3344"), []);
      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns finding if function is called", async () => {
      const data = functionInterface.encodeFunctionData(functionFragments[0].name, [createAddress("0x1234")]);
      
      const traces: TraceProps[] = [
        { to: MOCK_CONTRACT_ADDRESS, input: data }
      ];

      mockTxEvent.addTraces(...traces);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        createFunctionFinding(functionFragments[0].name, functionFragments[0].name, { _admin: createAddress("0x1234") }),
      ]);
    });

    it("returns findings with events emitted", async () => {

      mockTxEvent.addInterfaceEventLog(eventFragments[0], MOCK_CONTRACT_ADDRESS, []);
      mockTxEvent.addInterfaceEventLog(eventFragments[1], MOCK_CONTRACT_ADDRESS, []);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual
      ([
        createEventFinding(eventFragments[0].name, {}),
        createEventFinding(eventFragments[1].name, {})
      ]);

    });

 /*    it("returns findings with Event and Function call alerts", async () => {
      mockTxEvent.addInterfaceEventLog(eventFragments[0], MOCK_CONTRACT_ADDRESS, []);
      mockTxEvent.addInterfaceEventLog(eventFragments[1], MOCK_CONTRACT_ADDRESS, []);


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
    }); */
  });
});
