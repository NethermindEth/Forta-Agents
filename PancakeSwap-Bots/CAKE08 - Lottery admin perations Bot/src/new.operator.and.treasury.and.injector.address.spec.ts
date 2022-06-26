import {
    HandleTransaction,
    createTransactionEvent,
  } from "forta-agent"
  
import agent from "./new.operator.and.treasury.and.injector.address"
import {events, PanCakeSwapLottery_Address} from "./agent.config"
  
  describe("PancakeSwap Lottery", () => {
    let handleTransaction: HandleTransaction
    const mockTxEvent = createTransactionEvent({} as any);
  
    beforeAll(() => {
      handleTransaction = agent.handleTransaction
    })
  
    describe("NewOperatorAndTreasuryAndInjectorAddresses handleTransaction", () => {
      it("returns no findings if there are no NewRandomGenerator events emmited ", async () => {
  
        mockTxEvent.filterLog = jest.fn().mockReturnValue([])
  
       
        const findings = await handleTransaction(mockTxEvent)

        
        expect(findings).toStrictEqual([]);
        expect(mockTxEvent.filterLog).toHaveBeenCalledTimes(1);
        expect(mockTxEvent.filterLog).toHaveBeenCalledWith(
          events.NewOperatorAndTreasuryAndInjectorAddresses,
          PanCakeSwapLottery_Address
        );
  
  
      })
    })
    
  })
  