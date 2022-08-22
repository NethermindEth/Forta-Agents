import { HandleTransaction, ethers, Finding } from "forta-agent";
import { TestTransactionEvent, createAddress, TraceProps } from "forta-agent-tools/lib/tests";
import { NetworkManager } from "forta-agent-tools";

import { provideHandleTransaction } from "./agent";

import { EVENT_ABI, FUNC_ABI } from "./abi";
import { createEventFinding, createFunctionFinding } from "./findings";

describe("CakeVault Test Suite", () => {
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
    handleTransaction = provideHandleTransaction(networkManager);

    functionInterface = new ethers.utils.Interface(FUNC_ABI);

    EVENT_ABI.forEach((event) => {
      eventFragments.push(ethers.utils.EventFragment.fromString(event.slice("event ".length)));
    });

    FUNC_ABI.forEach((func) => {
      functionFragments.push(ethers.utils.FunctionFragment.fromString(func.slice("function ".length)));
    });

    mockEventFragment = ethers.utils.EventFragment.from("MockEvent(uint256)");
  });

  it("returns empty findings if no event is emitted or function called", async () => {
    const findings: Finding[] = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([]);
  });

  it("returns empty findings if the event emitted does not come from the correct contract address", async () => {
    mockTxEvent.addInterfaceEventLog(eventFragments[0], createAddress("0x3344"), []);
    const findings: Finding[] = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([]);
  });

  it("returns finding if function is called", async () => {
    const data: string = functionInterface.encodeFunctionData(functionFragments[0].name, [createAddress("0x1234")]);

    const traces: TraceProps[] = [{ to: MOCK_CONTRACT_ADDRESS, input: data }];

    mockTxEvent.addTraces(...traces);

    const findings: Finding[] = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([
      createFunctionFinding(functionFragments[0].name, {
        admin: createAddress("0x1234"),
      }),
    ]);
  });

  it("returns findings with events emitted", async () => {
    mockTxEvent.addInterfaceEventLog(eventFragments[0], MOCK_CONTRACT_ADDRESS, []);
    mockTxEvent.addInterfaceEventLog(eventFragments[1], MOCK_CONTRACT_ADDRESS, []);

    const findings: Finding[] = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([
      createEventFinding(eventFragments[0].name),
      createEventFinding(eventFragments[1].name),
    ]);
  });

  it("returns findings with Event and Function call alerts", async () => {
    mockTxEvent.addInterfaceEventLog(eventFragments[0], MOCK_CONTRACT_ADDRESS, []);
    mockTxEvent.addInterfaceEventLog(eventFragments[1], MOCK_CONTRACT_ADDRESS, []);

    const dataOne: string = functionInterface.encodeFunctionData(functionFragments[0].name, [createAddress("0x1234")]);
    const dataTwo: string = functionInterface.encodeFunctionData(functionFragments[1].name, [createAddress("0x9843")]);
    const dataThree: string = functionInterface.encodeFunctionData(functionFragments[2].name, [100000]);
    const dataFour: string = functionInterface.encodeFunctionData(functionFragments[3].name, [200000]);
    const dataFive: string = functionInterface.encodeFunctionData(functionFragments[4].name, [300000]);

    const traces: TraceProps[] = [
      { to: MOCK_CONTRACT_ADDRESS, input: dataOne },
      { to: MOCK_CONTRACT_ADDRESS, input: dataTwo },
      { to: MOCK_CONTRACT_ADDRESS, input: dataThree },
      { to: MOCK_CONTRACT_ADDRESS, input: dataFour },
      { to: MOCK_CONTRACT_ADDRESS, input: dataFive },
    ];

    mockTxEvent.addTraces(...traces);

    const findings: Finding[] = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([
      createEventFinding(eventFragments[0].name),
      createEventFinding(eventFragments[1].name),
      createFunctionFinding(functionFragments[0].name, {
        admin: createAddress("0x1234"),
      }),
      createFunctionFinding(functionFragments[1].name, {
        treasury: createAddress("0x9843"),
      }),
      createFunctionFinding(functionFragments[2].name, { performanceFee: "100000" }),
      createFunctionFinding(functionFragments[3].name, { callFee: "200000" }),
      createFunctionFinding(functionFragments[4].name, { withdrawFee: "300000" }),
    ]);
  });

  it("returns finding only for the correct event", async () => {
    mockTxEvent.addInterfaceEventLog(eventFragments[0], MOCK_CONTRACT_ADDRESS, []);
    mockTxEvent.addInterfaceEventLog(mockEventFragment, MOCK_CONTRACT_ADDRESS, [678]);

    const findings: Finding[] = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([createEventFinding(eventFragments[0].name)]);
  });

  it("returns finding only for the correct function", async () => {
    const dataOne: string = functionInterface.encodeFunctionData(functionFragments[0].name, [createAddress("0x3456")]);

    const mockFunctionInterface = new ethers.utils.Interface(["function mockFunction(uint256 x)"]);
    const dataTwo: string = mockFunctionInterface.encodeFunctionData("mockFunction", [123456]);

    const traces: TraceProps[] = [
      { to: MOCK_CONTRACT_ADDRESS, input: dataOne },
      { to: MOCK_CONTRACT_ADDRESS, input: dataTwo },
    ];

    mockTxEvent.addTraces(...traces);

    const findings: Finding[] = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([
      createFunctionFinding(functionFragments[0].name, {
        admin: createAddress("0x3456"),
      }),
    ]);
  });
});
