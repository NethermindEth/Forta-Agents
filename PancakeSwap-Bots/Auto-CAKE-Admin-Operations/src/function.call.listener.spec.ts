import { HandleTransaction, ethers, Finding } from "forta-agent";
import { TestTransactionEvent, createAddress, TraceProps } from "forta-agent-tools/lib/tests";


import bot from "./function.call.listener";

import { ABI } from "./abi";
import { createFunctionFinding } from "./findings";

describe("CakeVault", () => {
  let handleTransaction: HandleTransaction;

  let mockTxEvent: TestTransactionEvent;

  let functionInterface: ethers.utils.Interface;

  const MOCK_CONTRACT_ADDRESS = createAddress("0x0123");

  let functionFragments: ethers.utils.FunctionFragment[] = [];

  beforeEach(() => {
    mockTxEvent = new TestTransactionEvent();
  });


  beforeAll(() => {
   
    handleTransaction = bot.provideHandleTransaction(MOCK_CONTRACT_ADDRESS);

    functionInterface = new ethers.utils.Interface(ABI);

    ABI.forEach((func) => {
        functionFragments.push(ethers.utils.FunctionFragment.fromString(func.slice("function ".length)))
      });
  
  });


  describe("Function handleTransaction", () => {
    it("returns empty findings if no function is called", async () => {

      const findings: Finding[] = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if the function called does not come from the correct contract address", async () => {

        const data:string = functionInterface.encodeFunctionData(functionFragments[0].name, [createAddress("0x1234")]);
      
        const traces: TraceProps[] = [
          { to: createAddress("0xa748"), input: data }
        ];
  
        mockTxEvent.addTraces(...traces);
  
        const findings: Finding[] = await handleTransaction(mockTxEvent);
  

        expect(findings).toStrictEqual([]);
    });

    it("returns finding only for the correct function", async () => {

        const data_1:string = functionInterface.encodeFunctionData(functionFragments[3].name, [123456]);

        const mockFunctionInterface = new ethers.utils.Interface(["function mockFunction(uint256 x)"]);
        const data_2:string = mockFunctionInterface.encodeFunctionData("mockFunction", [123456]);
  
      
        const traces: TraceProps[] = [
          { to: MOCK_CONTRACT_ADDRESS, input: data_1 },
          { to: MOCK_CONTRACT_ADDRESS, input: data_2 }
        ];
  
        mockTxEvent.addTraces(...traces);
  
        const findings: Finding[] = await handleTransaction(mockTxEvent);
  

        expect(findings).toStrictEqual([
            createFunctionFinding(functionFragments[3].name, functionFragments[3].name, {_callFee: "123456"})
        ]);
    });

    it("returns finding if setAdmin is called", async () => {

        const data:string = functionInterface.encodeFunctionData(functionFragments[0].name, [createAddress("0x1234")]);
      
        const traces: TraceProps[] = [
          { to: MOCK_CONTRACT_ADDRESS, input: data }
        ];
  
        mockTxEvent.addTraces(...traces);
  
        const findings: Finding[] = await handleTransaction(mockTxEvent);
  

        expect(findings).toStrictEqual([
            createFunctionFinding(functionFragments[0].name, functionFragments[0].name, {_admin:createAddress("0x1234")})
        ]);

    });

    it("returns finding if setTreasury is called", async () => {

        const data:string = functionInterface.encodeFunctionData(functionFragments[1].name, [createAddress("0x8994")]);
      
        const traces: TraceProps[] = [
          { to: MOCK_CONTRACT_ADDRESS, input: data }
        ];
  
        mockTxEvent.addTraces(...traces);
  
        const findings: Finding[] = await handleTransaction(mockTxEvent);
  

        expect(findings).toStrictEqual([
            createFunctionFinding(functionFragments[1].name, functionFragments[1].name, {_treasury:createAddress("0x8994")})
        ]);

    });

    it("returns finding if setPerformanceFee is called", async () => {

        const data:string = functionInterface.encodeFunctionData(functionFragments[2].name, [100000]);
      
        const traces: TraceProps[] = [
          { to: MOCK_CONTRACT_ADDRESS, input: data }
        ];
  
        mockTxEvent.addTraces(...traces);
  
        const findings: Finding[] = await handleTransaction(mockTxEvent);
  

        expect(findings).toStrictEqual([
            createFunctionFinding(functionFragments[2].name, functionFragments[2].name, {_performanceFee: "100000"})
        ]);

    });

    it("returns finding if setCallFee is called", async () => {

        const data:string = functionInterface.encodeFunctionData(functionFragments[3].name, [200000]);
      
        const traces: TraceProps[] = [
          { to: MOCK_CONTRACT_ADDRESS, input: data }
        ];
  
        mockTxEvent.addTraces(...traces);
  
        const findings: Finding[] = await handleTransaction(mockTxEvent);
  

        expect(findings).toStrictEqual([
            createFunctionFinding(functionFragments[3].name, functionFragments[3].name, {_callFee: "200000"})
        ]);

    });

    it("returns finding if setWithdrawFee is called", async () => {

        const data:string = functionInterface.encodeFunctionData(functionFragments[4].name, [300000]);
      
        const traces: TraceProps[] = [
          { to: MOCK_CONTRACT_ADDRESS, input: data }
        ];
  
        mockTxEvent.addTraces(...traces);
  
        const findings: Finding[] = await handleTransaction(mockTxEvent);
  

        expect(findings).toStrictEqual([
            createFunctionFinding(functionFragments[4].name, functionFragments[4].name, {_withdrawFee: "300000"})
        ]);

    });

    it("returns findings if multiple functions are called", async () => {

      const data_1:string = functionInterface.encodeFunctionData(functionFragments[0].name, [createAddress("0x1204")]);
      const data_2:string = functionInterface.encodeFunctionData(functionFragments[1].name, [createAddress("0x9803")]);
      const data_3:string = functionInterface.encodeFunctionData(functionFragments[2].name, [400000]);
      const data_4:string = functionInterface.encodeFunctionData(functionFragments[3].name, [500000]);
      const data_5:string = functionInterface.encodeFunctionData(functionFragments[4].name, [600000]);
      
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
        createFunctionFinding(functionFragments[0].name, functionFragments[0].name, {_admin: createAddress("0x1204")}),
        createFunctionFinding(functionFragments[1].name, functionFragments[1].name, {_treasury: createAddress("0x9803")}),
        createFunctionFinding(functionFragments[2].name, functionFragments[2].name, {_performanceFee: "400000"}),
        createFunctionFinding(functionFragments[3].name, functionFragments[3].name, {_callFee: "500000"}),
        createFunctionFinding(functionFragments[4].name, functionFragments[4].name, {_withdrawFee: "600000"}),     
      ]);

    });

  });
});
