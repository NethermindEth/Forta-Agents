import {
  HandleTransaction,
  createTransactionEvent,
} from "forta-agent"

import agent from "./agent"

describe("PancakeSwap Lottery", () => {
  let handleTransaction: HandleTransaction

  const mockNewGeneratorAgent = {
    handleTransaction: jest.fn(),
  }

  const mockNewOperatorAgent = {
    handleTransaction: jest.fn(),
  }

  const mockFunctionCallAgent = {
    handleTransaction: jest.fn(),
  }

  const mockTxEvent = createTransactionEvent({} as any)

  beforeAll(() => {
    handleTransaction = agent.provideHandleTransaction(mockNewGeneratorAgent, mockNewOperatorAgent, mockFunctionCallAgent)
  })

  describe("handleTransaction", () => {
    it("returns findings if there are events emmited and function calls ", async () => {

      mockTxEvent.filterLog = jest.fn().mockReturnValue([])

      const mockNewGeneratorFinding = { event: "NewRandomGenerator" }
      const mockNewOperatorFinding = { event: "NewOperatorAndTreasuryAndInjectorAddresses" }
      const mockFunctionCallFinding = { function: "setMaxNumberTicketsPerBuy" }

      mockNewGeneratorAgent.handleTransaction.mockReturnValueOnce([mockNewGeneratorFinding])
      mockNewOperatorAgent.handleTransaction.mockReturnValueOnce([mockNewOperatorFinding])
      mockFunctionCallAgent.handleTransaction.mockReturnValueOnce([mockFunctionCallFinding])

      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([mockNewGeneratorFinding, mockNewOperatorFinding, mockFunctionCallFinding])
      expect(mockNewGeneratorAgent.handleTransaction).toHaveBeenCalledTimes(1)
      expect(mockNewGeneratorAgent.handleTransaction).toHaveBeenCalledWith(mockTxEvent)

      expect(mockNewOperatorAgent.handleTransaction).toHaveBeenCalledTimes(1)
      expect(mockNewOperatorAgent.handleTransaction).toHaveBeenCalledWith(mockTxEvent)

      expect(mockFunctionCallAgent.handleTransaction).toHaveBeenCalledTimes(1)
      expect(mockFunctionCallAgent.handleTransaction).toHaveBeenCalledWith(mockTxEvent)

    })

  })
})
