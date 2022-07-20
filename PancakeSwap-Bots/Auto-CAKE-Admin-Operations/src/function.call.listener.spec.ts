import { HandleTransaction, ethers, Finding } from "forta-agent";
import { TestTransactionEvent, createAddress, TraceProps } from "forta-agent-tools/lib/tests";

import { provideHandleTransaction } from "./function.call.listener";

import { FUNC_ABI } from "./abi";
import { createFunctionFinding } from "./findings";

describe("CakeVault Function Listener Test Suite", () => {
  let handleTransaction: HandleTransaction;

  let mockTxEvent: TestTransactionEvent;

  let functionInterface: ethers.utils.Interface;

  const MOCK_CONTRACT_ADDRESS = createAddress("0x0123");

  let functionFragments: ethers.utils.FunctionFragment[] = [];

  beforeEach(() => {
    mockTxEvent = new TestTransactionEvent();
  });

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(MOCK_CONTRACT_ADDRESS);

    functionInterface = new ethers.utils.Interface(FUNC_ABI);

    FUNC_ABI.forEach((func) => {
      functionFragments.push(ethers.utils.FunctionFragment.fromString(func.slice("function ".length)));
    });
  });

  it("returns empty findings if no function is called", async () => {
    const findings: Finding[] = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([]);
  });

  it("returns empty findings if the function called does not come from the correct contract address", async () => {
    const data: string = functionInterface.encodeFunctionData(functionFragments[0].name, [createAddress("0x1234")]);

    const traces: TraceProps[] = [{ to: createAddress("0xa748"), input: data }];

    mockTxEvent.addTraces(...traces);

    const findings: Finding[] = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([]);
  });

  it("returns finding only for the correct function call", async () => {
    const dataOne: string = functionInterface.encodeFunctionData(functionFragments[3].name, [123456]);

    const mockFunctionInterface = new ethers.utils.Interface(["function mockFunction(uint256 x)"]);
    const dataTwo: string = mockFunctionInterface.encodeFunctionData("mockFunction", [123456]);

    const traces: TraceProps[] = [
      { to: MOCK_CONTRACT_ADDRESS, input: dataOne },
      { to: MOCK_CONTRACT_ADDRESS, input: dataTwo },
    ];

    mockTxEvent.addTraces(...traces);

    const findings: Finding[] = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([createFunctionFinding(functionFragments[3].name, { callFee: "123456" })]);
  });

  it("returns findings for the correct function calls", async () => {
    const dataOne: string = functionInterface.encodeFunctionData(functionFragments[3].name, [123456]);
    const dataTwo: string = functionInterface.encodeFunctionData(functionFragments[0].name, [createAddress("0x0001")]);

    const mockFunctionInterface = new ethers.utils.Interface(["function mockFunction(uint256 x)"]);
    const dataThree: string = mockFunctionInterface.encodeFunctionData("mockFunction", [123456]);

    const traces: TraceProps[] = [
      { to: MOCK_CONTRACT_ADDRESS, input: dataOne },
      { to: MOCK_CONTRACT_ADDRESS, input: dataTwo },
      { to: MOCK_CONTRACT_ADDRESS, input: dataThree },
    ];

    mockTxEvent.addTraces(...traces);

    const findings: Finding[] = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([
      createFunctionFinding(functionFragments[3].name, { callFee: "123456" }),
      createFunctionFinding(functionFragments[0].name, { admin: createAddress("0x0001") }),
    ]);
  });

  it("returns finding if setAdmin is called", async () => {
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

  it("returns finding if setTreasury is called", async () => {
    const data: string = functionInterface.encodeFunctionData(functionFragments[1].name, [createAddress("0x8994")]);

    const traces: TraceProps[] = [{ to: MOCK_CONTRACT_ADDRESS, input: data }];

    mockTxEvent.addTraces(...traces);

    const findings: Finding[] = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([
      createFunctionFinding(functionFragments[1].name, {
        treasury: createAddress("0x8994"),
      }),
    ]);
  });

  it("returns finding if setPerformanceFee is called", async () => {
    const data: string = functionInterface.encodeFunctionData(functionFragments[2].name, [100000]);

    const traces: TraceProps[] = [{ to: MOCK_CONTRACT_ADDRESS, input: data }];

    mockTxEvent.addTraces(...traces);

    const findings: Finding[] = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([createFunctionFinding(functionFragments[2].name, { performanceFee: "100000" })]);
  });

  it("returns finding if setCallFee is called", async () => {
    const data: string = functionInterface.encodeFunctionData(functionFragments[3].name, [200000]);

    const traces: TraceProps[] = [{ to: MOCK_CONTRACT_ADDRESS, input: data }];

    mockTxEvent.addTraces(...traces);

    const findings: Finding[] = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([createFunctionFinding(functionFragments[3].name, { callFee: "200000" })]);
  });

  it("returns finding if setWithdrawFee is called", async () => {
    const data: string = functionInterface.encodeFunctionData(functionFragments[4].name, [300000]);

    const traces: TraceProps[] = [{ to: MOCK_CONTRACT_ADDRESS, input: data }];

    mockTxEvent.addTraces(...traces);

    const findings: Finding[] = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([createFunctionFinding(functionFragments[4].name, { withdrawFee: "300000" })]);
  });

  it("returns findings if multiple functions are called", async () => {
    const dataOne: string = functionInterface.encodeFunctionData(functionFragments[0].name, [createAddress("0x1204")]);
    const dataTwo: string = functionInterface.encodeFunctionData(functionFragments[1].name, [createAddress("0x9803")]);
    const dataThree: string = functionInterface.encodeFunctionData(functionFragments[2].name, [400000]);
    const dataFour: string = functionInterface.encodeFunctionData(functionFragments[3].name, [500000]);
    const dataFive: string = functionInterface.encodeFunctionData(functionFragments[4].name, [600000]);

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
      createFunctionFinding(functionFragments[0].name, {
        admin: createAddress("0x1204"),
      }),
      createFunctionFinding(functionFragments[1].name, {
        treasury: createAddress("0x9803"),
      }),
      createFunctionFinding(functionFragments[2].name, { performanceFee: "400000" }),
      createFunctionFinding(functionFragments[3].name, { callFee: "500000" }),
      createFunctionFinding(functionFragments[4].name, { withdrawFee: "600000" }),
    ]);
  });
});
