import {
  Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent
} from "forta-agent";
import { encodeParameters, TestTransactionEvent } from "forta-agent-tools";
import { generalTestFindingGenerator } from "forta-agent-tools/lib/tests.utils";
import agent from "./agent";
import { COLLATERAL_FACTOR_EVENT_ALERT_ID, COMPOUND_COMPTROLLER_ADDRESS, NEW_COLLATERAL_FACTOR_SIGNATURE } from "./utils";

const mockAddress = '0xB44ddb00B19a2F20E3c1C31A14C8965D75a8e4De'

function generateEvent(newMantissa: number) {
  return encodeParameters(
    ['address', 'uint256', 'uint256'],
    [mockAddress, 1, newMantissa],
  )
}

function generateExpectedFinding(expectedMantissa: string) {
  return Finding.fromObject({
    name: "COMPOUND NEW COLLATERAL FACTOR EVENT",
    description: "Updated collateral factor mantissa for Compound",
    alertId: COLLATERAL_FACTOR_EVENT_ALERT_ID,
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: 'Compound',
    metadata: {
      mantissa: expectedMantissa
    }
  })
}

describe("compount detect update to collateral factor mantissa", () => {
  let handleTransaction: HandleTransaction

  beforeAll(() => {
    handleTransaction = agent.handleTransaction
  })

  describe("handleTransaction", () => {
    it("returns a finding if collateral update event has occured", async () => {
      const data = encodeParameters(
        ['address', 'uint256', 'uint256'],
        [mockAddress, 1, 2]
      )
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .addEventLog(
          NEW_COLLATERAL_FACTOR_SIGNATURE,
          COMPOUND_COMPTROLLER_ADDRESS,
          data,
        )

      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "COMPOUND NEW COLLATERAL FACTOR EVENT",
          description: "Updated collateral factor mantissa for Compound",
          alertId: COLLATERAL_FACTOR_EVENT_ALERT_ID,
          type: FindingType.Info,
          severity: FindingSeverity.Info,
          protocol: 'Compound',
          metadata: {
            mantissa: '2'
          }
        }),
      ])
    })

    it("returns multiple findings when multiple collateral update events have occured", async() => {
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .addEventLog(
          NEW_COLLATERAL_FACTOR_SIGNATURE,
          COMPOUND_COMPTROLLER_ADDRESS,
          generateEvent(2),
        )
        .addEventLog(
          NEW_COLLATERAL_FACTOR_SIGNATURE,
          COMPOUND_COMPTROLLER_ADDRESS,
          generateEvent(4),
        )
        .addEventLog(
          NEW_COLLATERAL_FACTOR_SIGNATURE,
          COMPOUND_COMPTROLLER_ADDRESS,
          generateEvent(5),
        )

      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        generateExpectedFinding('2'),
        generateExpectedFinding('4'),
        generateExpectedFinding('5'),
      ])
    })

    it("returns empty findings if no collateral update event has occured", async () => {
      const txEvent = new TestTransactionEvent();
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([]);
    })

    it("returns empty findings if event is not from the compound address", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .addEventLog(NEW_COLLATERAL_FACTOR_SIGNATURE, mockAddress)

      const findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    })
  })
})
