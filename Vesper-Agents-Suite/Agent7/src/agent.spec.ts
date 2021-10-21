import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent
} from "forta-agent"
import { TestTransactionEvent, encodeParameters} from "forta-agent-tools";
import agent from "./agent"

import {
  NEW_IMPLEMENTATION_SIGNATURE,
  COMPOUND_COMPTROLLER_ADDRESS,
  NEW_IMPLEMENTATION_EVENT_ALERT_ID
} from "./utils"

describe("high gas agent", () => {
  let handleTransaction: HandleTransaction
  const mockAddress = '0xB44ddb00B19a2F20E3c1C31A14C8965D75a8e4De'
  const oldAddress1 = '0x7042499A36c4c572bf9C1e9cD384F63FaF10800A'
  const newAddress1 = '0x97AF9877E4a815b532153422F5B4127F296a1487'
  const oldAddress2 = '0x49f6207C0cB311cA52f2AA0D73825bC75D57fB1e'
  const newAddress2 = '0x79a08F3Bf26Ad269a0832bd3467F236c9D0257d6'

  beforeAll(() => {
    handleTransaction = agent.handleTransaction
  })

  describe("handleTransaction", () => {
    it("returns a finding if there is a newimplementation event from compound comtroller address", async() => {
      const data = encodeParameters(
        ['address','address'],
        [oldAddress1,newAddress1]
      )

      const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(NEW_IMPLEMENTATION_SIGNATURE, COMPOUND_COMPTROLLER_ADDRESS, data)
      
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: 'COMPOUND COMPTROLLER NEW IMPLEMENTATION EVENT',
          description: 'Update implementation logic for Compound Comptroller',
          alertId: NEW_IMPLEMENTATION_EVENT_ALERT_ID,
          type: FindingType.Info,
          severity: FindingSeverity.Info,
          protocol: 'Compound',
          metadata: {
            newAddress: newAddress1
          }
        })
      ])
    })

    it("returns empty findings if no implemtation update event has occured", async() => {
      const txEvent = new TestTransactionEvent()
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])
    })

    it("returns empty findings if event is not from the compound address", async() => {
      const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(NEW_IMPLEMENTATION_SIGNATURE,mockAddress)
      const findings = await handleTransaction(txEvent)
      expect(findings).toStrictEqual([])
    })

    it("returns multiple findings if there are multiple newimplementation events from compoundaddress", async() => {
      const data1 = encodeParameters(
        ['address','address'],
        [oldAddress1,newAddress1]
      )

      const data2 = encodeParameters(
        ['address','address'],
        [oldAddress2,newAddress2]
      )

      const txEvent: TransactionEvent = new TestTransactionEvent()
                                          .addEventLog(NEW_IMPLEMENTATION_SIGNATURE, COMPOUND_COMPTROLLER_ADDRESS, data1)
                                          .addEventLog(NEW_IMPLEMENTATION_SIGNATURE, COMPOUND_COMPTROLLER_ADDRESS, data2)
      
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: 'COMPOUND COMPTROLLER NEW IMPLEMENTATION EVENT',
          description: 'Update implementation logic for Compound Comptroller',
          alertId: NEW_IMPLEMENTATION_EVENT_ALERT_ID,
          type: FindingType.Info,
          severity: FindingSeverity.Info,
          protocol: 'Compound',
          metadata: {
            newAddress: newAddress1
          }
        }),
        Finding.fromObject({
          name: 'COMPOUND COMPTROLLER NEW IMPLEMENTATION EVENT',
          description: 'Update implementation logic for Compound Comptroller',
          alertId: NEW_IMPLEMENTATION_EVENT_ALERT_ID,
          type: FindingType.Info,
          severity: FindingSeverity.Info,
          protocol: 'Compound',
          metadata: {
            newAddress: newAddress2
          }
        })
      ])
    })
  })
})
