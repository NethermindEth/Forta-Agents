import { HandleTransaction, ethers, Finding } from "forta-agent";
import { TestTransactionEvent, createAddress, TraceProps } from "forta-agent-tools/lib/tests";
import { NetworkManager } from "forta-agent-tools";


import bot from "./agent";

import { EVENTS, ABI } from "./abi";
import { createEventFinding, createFunctionFinding } from "./findings";

describe("CakeVault", () => {
  let handleTransaction: HandleTransaction;

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
      const data:string = functionInterface.encodeFunctionData(functionFragments[0].name, [createAddress("0x1234")]);
      
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

     it("returns findings with Event and Function call alerts", async () => {
      mockTxEvent.addInterfaceEventLog(eventFragments[0], MOCK_CONTRACT_ADDRESS, []);
      mockTxEvent.addInterfaceEventLog(eventFragments[1], MOCK_CONTRACT_ADDRESS, []);

      const data_1:string = functionInterface.encodeFunctionData(functionFragments[0].name, [createAddress("0x1234")]);
      const data_2:string = functionInterface.encodeFunctionData(functionFragments[1].name, [createAddress("0x9843")]);
      const data_3:string = functionInterface.encodeFunctionData(functionFragments[2].name, [100000]);
      const data_4:string = functionInterface.encodeFunctionData(functionFragments[3].name, [200000]);
      const data_5:string = functionInterface.encodeFunctionData(functionFragments[4].name, [300000]);
      
      const traces: TraceProps[] = [
        { to: MOCK_CONTRACT_ADDRESS, input: data_1 },
        { to: MOCK_CONTRACT_ADDRESS, input: data_2 },
        { to: MOCK_CONTRACT_ADDRESS, input: data_3 },
        { to: MOCK_CONTRACT_ADDRESS, input: data_4 },
        { to: MOCK_CONTRACT_ADDRESS, input: data_5 },
      ];

      mockTxEvent.addTraces(...traces);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual
      ([
        createEventFinding(eventFragments[0].name, {}),
        createEventFinding(eventFragments[1].name, {}),
        createFunctionFinding(functionFragments[0].name, functionFragments[0].name, {_admin: createAddress("0x1234")}),
        createFunctionFinding(functionFragments[1].name, functionFragments[1].name, {_treasury: createAddress("0x9843")}),
        createFunctionFinding(functionFragments[2].name, functionFragments[2].name, {_performanceFee: "100000"}),
        createFunctionFinding(functionFragments[3].name, functionFragments[3].name, {_callFee: "200000"}),
        createFunctionFinding(functionFragments[4].name, functionFragments[4].name, {_withdrawFee: "300000"}),     
      ]);

    });

    it("returns finding only for the correct event", async() =>{

      mockTxEvent.addInterfaceEventLog(eventFragments[0], MOCK_CONTRACT_ADDRESS, []);
      mockTxEvent.addInterfaceEventLog(mockEventFragment, MOCK_CONTRACT_ADDRESS, [678]);

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([createEventFinding(eventFragments[0].name, {})]);


    });

  });
});
