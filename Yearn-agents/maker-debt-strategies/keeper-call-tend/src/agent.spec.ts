import {
  HandleTransaction,
  Finding,
  FindingSeverity,
  FindingType
} from "forta-agent"
import agent from "./agent"
import {
  TestTransactionEvent,
  createAddress,
  encodeFunctionCall,
} from 'forta-agent-tools'
import MakerFetcher from './maker.fetcher'
import {harvestABI, tendABI} from './abi'

import Mock, {Args} from "./mock"

const createMock = (args: Args) => {
  return {
    eth: {
      Contract: Mock.build_Mock(args)
    },
  } as any;
}

// @DEV: to add test for case args = [true, false]
// @DEV: to make constant for the addresses
// @DEV: create better jest mocking
describe("Agent - Keeper called Tend", () => {
  let handleTransaction: HandleTransaction

  describe("Both two Maker strategies are active", () => {

    afterEach(() => {
      jest.resetAllMocks()
    })

    beforeAll(() => {
      const args : Args = [true,true]
      const web3 = createMock(args)
      handleTransaction = agent.provideHandleTransaction(new MakerFetcher(web3))
    })

    it("return 0 finding if there is no function call", async() => {
      let findings: Finding[] = [];
        
      const txEvent: any = new TestTransactionEvent()

      findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
      console.log(Mock.strategies)
    })
    
    it("return 1 finding if there is 1 tend function call by the keeper", async () => {
      let findings: Finding[] = [];
      
      const txEvent: any = new TestTransactionEvent()
        .addTraces(
          {
            from: createAddress('0xa'),
            input: encodeFunctionCall(tendABI,[]),
            to: createAddress('0x2')
          }
        ).setStatus(true);

      findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "MAKER - Keeper called tend",
          description: "A Maker strategy is called by its keeper",
          severity: FindingSeverity.Info, 
          type: FindingType.Info, 
          alertId: "Yearn-2-2",
          protocol: "Yearn", 
          metadata: {
            strategy: createAddress('0x2')
          }
        })
      ])
    })

    it("return 2 findings if there are 2 tend function calls by the keepers (of different Maker Stratetegies)", async () => {
      let findings: Finding[] = [];
      
      const txEvent: any = new TestTransactionEvent()
        .addTraces(
          {
            from: createAddress('0xa'),
            input: encodeFunctionCall(tendABI,[]),
            to: createAddress('0x2')
          }
        ).addTraces(
          {
            from: createAddress('0xb'),
            input: encodeFunctionCall(tendABI,[]),
            to:createAddress('0x3')
          }
        ).setStatus(true);

      findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "MAKER - Keeper called tend",
          description: "A Maker strategy is called by its keeper",
          severity: FindingSeverity.Info, 
          type: FindingType.Info, 
          alertId: "Yearn-2-2",
          protocol: "Yearn", 
          metadata: {
            strategy: createAddress('0x2')
          }
        }),
        Finding.fromObject({
          name: "MAKER - Keeper called tend",
          description: "A Maker strategy is called by its keeper",
          severity: FindingSeverity.Info, 
          type: FindingType.Info, 
          alertId: "Yearn-2-2",
          protocol: "Yearn", 
          metadata: {
            strategy: createAddress('0x3')
          }
        })
      ])
    })

    it("return 0 finding if the address which the tend function is called upon is not a Maker Strategy", async () => {
      let findings: Finding[] = [];
      
      const txEvent: any = new TestTransactionEvent()
        .addTraces(
          {
            from: createAddress('0xa'),
            input: encodeFunctionCall(tendABI,[]),
            to: createAddress('0x4')
          }
        ).setStatus(true);

      findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([])
    })

    it("return 0 finding if the address calling the tend function is not the keeper of the Maker Strategy", async () => {
      let findings: Finding[] = [];
      
      const txEvent: any = new TestTransactionEvent()
        .addTraces(
          {
            from: createAddress('0xc'),
            input: encodeFunctionCall(tendABI,[]),
            to: createAddress('0x2')
          }
        ).setStatus(true);

      findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([])
    })

    it("return 0 finding if the functon called is not tend function", async () => {
      let findings: Finding[] = [];
      
      const txEvent: any = new TestTransactionEvent()
        .addTraces(
          {
            from: createAddress('0xb'),
            input: encodeFunctionCall(harvestABI,[]),
            to: createAddress('0x3')
          }
        ).setStatus(true);

      findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([])
    })
  })

  describe("Only 1 Maker strategy is active", () => {

    afterEach(() => {
      jest.resetAllMocks()
    })

    beforeAll(() => {
      const args : Args = [true,false]
      const web3 = createMock(args)
      handleTransaction = agent.provideHandleTransaction(new MakerFetcher(web3))
    })

    it("return only 1 finding if each Maker strategy is called by its respective keeper", async () => {
      let findings: Finding[] = [];
      
      const txEvent: any = new TestTransactionEvent()
        .addTraces(
          {
            from: createAddress('0xa'),
            input: encodeFunctionCall(tendABI,[]),
            to: createAddress('0x2')
          }
        ).addTraces(
          {
            from: createAddress('0xb'),
            input: encodeFunctionCall(tendABI,[]),
            to:createAddress('0x3')
          }
        ).setStatus(true);

      findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "MAKER - Keeper called tend",
          description: "A Maker strategy is called by its keeper",
          severity: FindingSeverity.Info, 
          type: FindingType.Info, 
          alertId: "Yearn-2-2",
          protocol: "Yearn", 
          metadata: {
            strategy: createAddress('0x2')
          }
        })
      ])      
    })
  })
  
})
