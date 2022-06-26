import {
    Finding,
    FindingType,
    FindingSeverity,
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
      it("returns no findings if there are no NewOperatorAndTreasuryAndInjectorAddresses events emmited ", async () => {
  
        mockTxEvent.filterLog = jest.fn().mockReturnValue([])
  
       
        const findings = await handleTransaction(mockTxEvent)

        
        expect(findings).toStrictEqual([]);
        expect(mockTxEvent.filterLog).toHaveBeenCalledTimes(1);
        expect(mockTxEvent.filterLog).toHaveBeenCalledWith(
          events.NewOperatorAndTreasuryAndInjectorAddresses,
          PanCakeSwapLottery_Address
        );
  
  
      })

      it("returns findings if there are NewOperatorAndTreasuryAndInjectorAddresses events emmited ", async () => {
  
        const mockSwapEvent = {
            args: {
              from: "0x0abc",
              operator: "0x0123",
              treasury: "0x0def",
              injector: "0x0456"
            }
          };

          mockTxEvent.filterLog = jest
            .fn()
            .mockReturnValue([mockSwapEvent]);
    
          const findings = await handleTransaction(mockTxEvent);
    
          const {from, operator, treasury, injector} = mockSwapEvent.args;
    
          expect(findings).toStrictEqual([
            Finding.fromObject({
                name: "New Operator And Treasury And Injector Addresses",
                description: `New Operator And Treasury And Injector Addresses`,
                alertId: "FORTA-2",
                severity: FindingSeverity.Info,
                type: FindingType.Info,
                metadata: {
                  from,  
                  operator,
                  treasury,
                  injector
                },
              }),
          ]);
          expect(mockTxEvent.filterLog).toHaveBeenCalledTimes(1);
          expect(mockTxEvent.filterLog).toHaveBeenCalledWith(events.NewOperatorAndTreasuryAndInjectorAddresses, PanCakeSwapLottery_Address);
  
      })

    })
    
  })
  