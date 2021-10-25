import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent
} from "forta-agent"
import { TestTransactionEvent, encodeParameters, createAddress} from "forta-agent-tools";
import agent from "./agent"

import {
  NEW_IMPLEMENTATION_SIGNATURE,
  COMPOUND_COMPTROLLER_ADDRESS,
  NEW_IMPLEMENTATION_EVENT_ALERT_ID_1,
  NEW_IMPLEMENTATION_EVENT_ALERT_ID_2,
  MOCKADDRESS,
  OLDADDRESS1,
  OLDADDRESS2,
  NEWADDRESS1,
  NEWADDRESS2,
  MARKET1,
  MARKET2
} from "./utils"

import {generateMockBuilder} from './mockContract'
describe("Comptroller and CToken NewImplementation Event Checking Agent", () => {
  
  let handleTransaction: HandleTransaction

  beforeAll(() => { 
    const web3 = {
      eth: {Contract: generateMockBuilder()}
    } as any
    handleTransaction = agent.provideHandleTransaction(web3)
  })

  it("returns empty findings if no implemtation update event has occured", async() => {
    const txEvent = new TestTransactionEvent()
    const findings = await handleTransaction(txEvent)

    expect(findings).toStrictEqual([])
  })

  it("return no finding if there is a newimplementation event not from Compound Comptroller or a market address of Compound Comptroller", async() => {
    const data1 = encodeParameters(
      ['address','address'],
      [OLDADDRESS1,NEWADDRESS1]
    )
    
    const txEvent = new TestTransactionEvent().addEventLog(NEW_IMPLEMENTATION_SIGNATURE, MOCKADDRESS, data1)
    
    const findings = await handleTransaction(txEvent)
    
    expect(findings).toStrictEqual([])
  })

  it("return multiple findings if there are both newimplementation events for Comptroller and CToken", async () =>{
    const data1 = encodeParameters(
      ['address','address'],
      [OLDADDRESS1, NEWADDRESS1]
    )
    const data2 = encodeParameters(
      ['address','address'],
      [OLDADDRESS2, NEWADDRESS2]
    )

    const txEvent = new TestTransactionEvent().addEventLog(NEW_IMPLEMENTATION_SIGNATURE, MARKET1, data1)
                                              .addEventLog(NEW_IMPLEMENTATION_SIGNATURE, COMPOUND_COMPTROLLER_ADDRESS, data2)

    const findings = await handleTransaction(txEvent)

    expect(findings).toStrictEqual([ 
      Finding.fromObject({
        name: 'COMPOUND COMPTROLLER NEW IMPLEMENTATION EVENT',
        description: 'Update implementation logic for Compound Comptroller',
        alertId: NEW_IMPLEMENTATION_EVENT_ALERT_ID_1,
        type: FindingType.Info,
        severity: FindingSeverity.Info,
        protocol: 'Compound',
        metadata: {
          newAddress: NEWADDRESS2
        }
      }),
      Finding.fromObject({
        name: 'CTOKEN NEW IMPLEMENTATION EVENT',
        description: 'Update implementation logic for a market on Compound',
        alertId: NEW_IMPLEMENTATION_EVENT_ALERT_ID_2,
        type: FindingType.Info,
        severity: FindingSeverity.Info,
        protocol: 'Compound',
        metadata: {
          newAddress: NEWADDRESS1
        }
      })
    ])    
  })

  describe("Test NewImplementation Events for CompoundComptroller", () => {
    it("returns a finding if there is a newimplementation event from compound comtroller address", async() => {
      const data = encodeParameters(
        ['address','address'],
        [OLDADDRESS1,NEWADDRESS1]
      )

      const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(NEW_IMPLEMENTATION_SIGNATURE, COMPOUND_COMPTROLLER_ADDRESS, data)
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: 'COMPOUND COMPTROLLER NEW IMPLEMENTATION EVENT',
          description: 'Update implementation logic for Compound Comptroller',
          alertId: NEW_IMPLEMENTATION_EVENT_ALERT_ID_1,
          type: FindingType.Info,
          severity: FindingSeverity.Info,
          protocol: 'Compound',
          metadata: {
            newAddress: NEWADDRESS1
          }
        })
      ])
    })

    it("returns multiple findings if there are multiple newimplementation events from compound comptroller address", async() => {
      const data1 = encodeParameters(
        ['address','address'],
        [OLDADDRESS1,NEWADDRESS1]
      )

      const data2 = encodeParameters(
        ['address','address'],
        [OLDADDRESS2,NEWADDRESS2]
      )

      const txEvent: TransactionEvent = new TestTransactionEvent()
                                          .addEventLog(NEW_IMPLEMENTATION_SIGNATURE, COMPOUND_COMPTROLLER_ADDRESS, data1)
                                          .addEventLog(NEW_IMPLEMENTATION_SIGNATURE, COMPOUND_COMPTROLLER_ADDRESS, data2)
      
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: 'COMPOUND COMPTROLLER NEW IMPLEMENTATION EVENT',
          description: 'Update implementation logic for Compound Comptroller',
          alertId: NEW_IMPLEMENTATION_EVENT_ALERT_ID_1,
          type: FindingType.Info,
          severity: FindingSeverity.Info,
          protocol: 'Compound',
          metadata: {
            newAddress: NEWADDRESS1
          }
        }),
        Finding.fromObject({
          name: 'COMPOUND COMPTROLLER NEW IMPLEMENTATION EVENT',
          description: 'Update implementation logic for Compound Comptroller',
          alertId: NEW_IMPLEMENTATION_EVENT_ALERT_ID_1,
          type: FindingType.Info,
          severity: FindingSeverity.Info,
          protocol: 'Compound',
          metadata: {
            newAddress: NEWADDRESS2
          }
        })
      ])
    })
  })

  describe("Test NewImplemntation Events for CTokens retrieved from getAllMarkets", () => {
    it("return a finding if there is a newimplementation event occurred from a market address of Compound Comptroller", async() => {
      const data1 = encodeParameters(
        ['address','address'],
        [OLDADDRESS1,NEWADDRESS1]
      )
      
      const txEvent = new TestTransactionEvent().addEventLog(NEW_IMPLEMENTATION_SIGNATURE, MARKET1, data1)
      
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([Finding.fromObject({
        name: 'CTOKEN NEW IMPLEMENTATION EVENT',
        description: 'Update implementation logic for a market on Compound',
        alertId: NEW_IMPLEMENTATION_EVENT_ALERT_ID_2,
        type: FindingType.Info,
        severity: FindingSeverity.Info,
        protocol: 'Compound',
        metadata: {
          newAddress: NEWADDRESS1
        }
      })])
    })

    it('return multiple findings if there are newimplementtion events from two market addresses of Compound Comptroller', async () => {
      const data1 = encodeParameters(
        ['address','address'],
        [OLDADDRESS1, NEWADDRESS1]
      )
      const data2 = encodeParameters(
        ['address','address'],
        [OLDADDRESS2, NEWADDRESS2]
      )

      const txEvent = new TestTransactionEvent().addEventLog(NEW_IMPLEMENTATION_SIGNATURE, MARKET1, data1)
                                                .addEventLog(NEW_IMPLEMENTATION_SIGNATURE, MARKET2, data2)

      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([ 
        Finding.fromObject({
          name: 'CTOKEN NEW IMPLEMENTATION EVENT',
          description: 'Update implementation logic for a market on Compound',
          alertId: NEW_IMPLEMENTATION_EVENT_ALERT_ID_2,
          type: FindingType.Info,
          severity: FindingSeverity.Info,
          protocol: 'Compound',
          metadata: {
            newAddress: NEWADDRESS1
          }
        }),
        Finding.fromObject({
          name: 'CTOKEN NEW IMPLEMENTATION EVENT',
          description: 'Update implementation logic for a market on Compound',
          alertId: NEW_IMPLEMENTATION_EVENT_ALERT_ID_2,
          type: FindingType.Info,
          severity: FindingSeverity.Info,
          protocol: 'Compound',
          metadata: {
            newAddress: NEWADDRESS2
          }
        })
      ])
    })
  })
})
