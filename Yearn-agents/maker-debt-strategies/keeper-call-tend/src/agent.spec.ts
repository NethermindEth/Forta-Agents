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
import { harvestABI, tendABI } from './abi'
import Mock,
      { currentMakerVaultRatio, 
        collateralizationRatio, 
        rebalanceTolerance,
        MAKER_STRATEGY_ADDRESS_1, 
        MAKER_STRATEGY_ADDRESS_2, 
        KEEPER_ADDRESS_1,
        KEEPER_ADDRESS_2,
       } from "./mock"

const createMock = () => {
  return {
    eth: {
      Contract: Mock.build_Mock()
    },
  } as any;
}

describe("Yearn debt strategies", () => {
  let handleTransaction: HandleTransaction

  beforeAll(() => {
    const web3 = createMock()
    handleTransaction = agent.provideHandleTransaction(new MakerFetcher(web3))
  })

  describe("Both two Maker strategies are active", () => {
    beforeEach(() => {
      Mock.createReturnValuesMockFunction([true, true])
    })

    describe("Both two Maker strategies have safe currentMakerVaultRatio", () => {
      beforeEach(() => {
        currentMakerVaultRatio.mockReturnValueOnce(18).mockReturnValueOnce(18)
        collateralizationRatio.mockReturnValueOnce(18).mockReturnValueOnce(18)
        rebalanceTolerance.mockReturnValueOnce(1).mockReturnValueOnce(1)
      })

      it("return 0 finding if there is no function call", async () => {
        let findings: Finding[] = [];

        const txEvent: any = new TestTransactionEvent();

        findings = await handleTransaction(txEvent);

        expect(findings).toStrictEqual([]);
      })

      it("return 1 finding if there is 1 tend function call by the keeper", async () => {
        let findings: Finding[] = [];

        const txEvent: any = new TestTransactionEvent()
          .addTraces(
            {
              from: KEEPER_ADDRESS_1,
              input: encodeFunctionCall(tendABI, []),
              to: MAKER_STRATEGY_ADDRESS_1
            }
          );

        findings = await handleTransaction(txEvent);

        expect(findings).toStrictEqual([
          Finding.fromObject({
            name: "MAKER Strategy - Keeper called tend",
            description: "A Maker strategy is called by its keeper",
            severity: FindingSeverity.Info,
            type: FindingType.Info,
            alertId: "Yearn-2-2",
            protocol: "Yearn",
            metadata: {
              strategy: MAKER_STRATEGY_ADDRESS_1
            }
          })
        ])
      })

      it("return 2 findings if there are 2 tend function calls by the keepers (of different Maker Stratetegies)", async () => {
        let findings: Finding[] = [];

        const txEvent: any = new TestTransactionEvent()
          .addTraces(
            {
              from: KEEPER_ADDRESS_1,
              input: encodeFunctionCall(tendABI, []),
              to: MAKER_STRATEGY_ADDRESS_1
            }
          ).addTraces(
            {
              from: KEEPER_ADDRESS_2,
              input: encodeFunctionCall(tendABI, []),
              to: MAKER_STRATEGY_ADDRESS_2
            }
          );

        findings = await handleTransaction(txEvent);

        expect(findings).toStrictEqual([
          Finding.fromObject({
            name: "MAKER Strategy - Keeper called tend",
            description: "A Maker strategy is called by its keeper",
            severity: FindingSeverity.Info,
            type: FindingType.Info,
            alertId: "Yearn-2-2",
            protocol: "Yearn",
            metadata: {
              strategy: MAKER_STRATEGY_ADDRESS_1
            }
          }),
          Finding.fromObject({
            name: "MAKER Strategy - Keeper called tend",
            description: "A Maker strategy is called by its keeper",
            severity: FindingSeverity.Info,
            type: FindingType.Info,
            alertId: "Yearn-2-2",
            protocol: "Yearn",
            metadata: {
              strategy: MAKER_STRATEGY_ADDRESS_2
            }
          })
        ])
      })

      it("return 0 finding if the address which the tend function is called upon is not a Maker Strategy", async () => {
        let findings: Finding[] = [];

        const txEvent: any = new TestTransactionEvent()
          .addTraces(
            {
              from: KEEPER_ADDRESS_1,
              input: encodeFunctionCall(tendABI, []),
              to: createAddress('0x4')
            }
          );

        findings = await handleTransaction(txEvent);

        expect(findings).toStrictEqual([])
      })

      it("return 0 finding if the address calling the tend function is not the keeper of the Maker Strategy", async () => {
        let findings: Finding[] = [];

        const txEvent: any = new TestTransactionEvent()
          .addTraces(
            {
              from: createAddress('0xc'),
              input: encodeFunctionCall(tendABI, []),
              to: MAKER_STRATEGY_ADDRESS_1
            }
          );

        findings = await handleTransaction(txEvent);

        expect(findings).toStrictEqual([])
      })

      it("return 0 finding if the functon called is not tend function", async () => {
        let findings: Finding[] = [];

        const txEvent: any = new TestTransactionEvent()
          .addTraces(
            {
              from: KEEPER_ADDRESS_2,
              input: encodeFunctionCall(harvestABI, []),
              to: MAKER_STRATEGY_ADDRESS_2
            }
          );

        findings = await handleTransaction(txEvent);

        expect(findings).toStrictEqual([])
      })
    })

    describe("Only one Maker strategy has risky currentMakerVaultRatio", () => {

      beforeEach(() => {
        currentMakerVaultRatio.mockReturnValueOnce(15).mockReturnValueOnce(18)
        collateralizationRatio.mockReturnValueOnce(18).mockReturnValueOnce(18)
        rebalanceTolerance.mockReturnValueOnce(1).mockReturnValueOnce(1)
      })

      describe("There is no tend function call (only consider 1 or many txEvents in these tests, in other tests, only use 1 txEvent)", () => {
        it("Return 1 finding when there is 1 txEvent received", async () => {
          let findings: Finding[];

          const txEvent: any = new TestTransactionEvent();

          findings = await (handleTransaction(txEvent));

          expect(findings).toStrictEqual([
            Finding.fromObject({
              name: "MAKER Strategy - MakerVaultRatio is less than acceptable ratio",
              description: "strategy.getCurrentMakerVaultRatio() < strategy.collateralizationRatio() - strategy.rebalanceTolerance()",
              severity: FindingSeverity.Medium,
              type: FindingType.Info,
              alertId: "Yearn-2-1",
              protocol: "Yearn",
              metadata: {
                strategy: MAKER_STRATEGY_ADDRESS_1
              }
            })
          ])
        }),

        it("Only return 1 finding even if there two txevents from the same block are received", async () => {
          let findings: Finding[];

          const txEvent1: any = new TestTransactionEvent().setBlock(10);
          const txEvent2: any = new TestTransactionEvent().setBlock(10);

          findings = await (handleTransaction(txEvent1));
          findings = findings.concat(await (handleTransaction(txEvent2)));

          expect(findings).toStrictEqual([
            Finding.fromObject({
              name: "MAKER Strategy - MakerVaultRatio is less than acceptable ratio",
              description: "strategy.getCurrentMakerVaultRatio() < strategy.collateralizationRatio() - strategy.rebalanceTolerance()",
              severity: FindingSeverity.Medium,
              type: FindingType.Info,
              alertId: "Yearn-2-1",
              protocol: "Yearn",
              metadata: {
                strategy: MAKER_STRATEGY_ADDRESS_1
              }
            })
          ])
        })
      })

      it("Return 2 findings if there is one tend function call by the keeper", async () => {
        let findings: Finding[];

        const txEvent: any = new TestTransactionEvent()
          .addTraces(
            {
              from: KEEPER_ADDRESS_1,
              input: encodeFunctionCall(tendABI, []),
              to: MAKER_STRATEGY_ADDRESS_1
            }
          );

        findings = await (handleTransaction(txEvent));

        expect(findings).toStrictEqual([
          Finding.fromObject({
            name: "MAKER Strategy - MakerVaultRatio is less than acceptable ratio",
            description: "strategy.getCurrentMakerVaultRatio() < strategy.collateralizationRatio() - strategy.rebalanceTolerance()",
            severity: FindingSeverity.Medium,
            type: FindingType.Info,
            alertId: "Yearn-2-1",
            protocol: "Yearn",
            metadata: {
              strategy: MAKER_STRATEGY_ADDRESS_1
            }
          }),
          Finding.fromObject({
            name: "MAKER Strategy - Keeper called tend",
            description: "A Maker strategy is called by its keeper",
            severity: FindingSeverity.Info,
            type: FindingType.Info,
            alertId: "Yearn-2-2",
            protocol: "Yearn",
            metadata: {
              strategy: MAKER_STRATEGY_ADDRESS_1
            }
          })
        ])
      })

    })

    describe("Both two Maker strategies have risky currentMakerVaultRatio", () => {
      beforeEach(() => {
        currentMakerVaultRatio.mockReturnValueOnce(15).mockReturnValueOnce(14)
        collateralizationRatio.mockReturnValueOnce(18).mockReturnValueOnce(17)
        rebalanceTolerance.mockReturnValueOnce(1).mockReturnValueOnce(1)
      })

      it("Return 2 findings when there is no tend function call", async () => {
        let findings: Finding[];

        const txEvent: any = new TestTransactionEvent();

        findings = await (handleTransaction(txEvent));

        expect(findings).toStrictEqual([
          Finding.fromObject({
            name: "MAKER Strategy - MakerVaultRatio is less than acceptable ratio",
            description: "strategy.getCurrentMakerVaultRatio() < strategy.collateralizationRatio() - strategy.rebalanceTolerance()",
            severity: FindingSeverity.Medium,
            type: FindingType.Info,
            alertId: "Yearn-2-1",
            protocol: "Yearn",
            metadata: {
              strategy: MAKER_STRATEGY_ADDRESS_1
            }
          }),
          Finding.fromObject({
            name: "MAKER Strategy - MakerVaultRatio is less than acceptable ratio",
            description: "strategy.getCurrentMakerVaultRatio() < strategy.collateralizationRatio() - strategy.rebalanceTolerance()",
            severity: FindingSeverity.Medium,
            type: FindingType.Info,
            alertId: "Yearn-2-1",
            protocol: "Yearn",
            metadata: {
              strategy: MAKER_STRATEGY_ADDRESS_2
            }
          }),
        ])
      })
    })
  })

  describe("Only 1 Maker strategy is active", () => {
    describe("Both Maker strategies have risky currentMakerVaultRatio", () => {

      beforeEach(() => {
        Mock.createReturnValuesMockFunction([true, false])
        currentMakerVaultRatio.mockReturnValueOnce(15).mockReturnValueOnce(14)
        collateralizationRatio.mockReturnValueOnce(18).mockReturnValueOnce(17)
        rebalanceTolerance.mockReturnValueOnce(1).mockReturnValueOnce(1)
      })

      it("return 2 findings if both Maker strategies are called by its respective keeper", async () => {
        let findings: Finding[] = [];

        const txEvent: any = new TestTransactionEvent()
          .addTraces(
            {
              from: KEEPER_ADDRESS_1,
              input: encodeFunctionCall(tendABI, []),
              to: MAKER_STRATEGY_ADDRESS_1
            }
          ).addTraces(
            {
              from: KEEPER_ADDRESS_2,
              input: encodeFunctionCall(tendABI, []),
              to: MAKER_STRATEGY_ADDRESS_2
            }
          );

        findings = await handleTransaction(txEvent);

        expect(findings).toStrictEqual([
          Finding.fromObject({
            name: "MAKER Strategy - MakerVaultRatio is less than acceptable ratio",
            description: "strategy.getCurrentMakerVaultRatio() < strategy.collateralizationRatio() - strategy.rebalanceTolerance()",
            severity: FindingSeverity.Medium,
            type: FindingType.Info,
            alertId: "Yearn-2-1",
            protocol: "Yearn",
            metadata: {
              strategy: MAKER_STRATEGY_ADDRESS_1
            }
          }),
          Finding.fromObject({
            name: "MAKER Strategy - Keeper called tend",
            description: "A Maker strategy is called by its keeper",
            severity: FindingSeverity.Info,
            type: FindingType.Info,
            alertId: "Yearn-2-2",
            protocol: "Yearn",
            metadata: {
              strategy: MAKER_STRATEGY_ADDRESS_1
            }
          })
        ])


      })

    })
  })

})
