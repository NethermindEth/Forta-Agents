import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent,
  ethers,
} from "forta-agent";

import agent from "./agent"
import {events, ABI, PanCakeSwapLottery_Address} from "./agent.config"

describe("PancakeSwap Lottery", () => {
  let handleTransaction: HandleTransaction;

  const mockNewGeneratorAgent = {
    handleTransaction: jest.fn(),
  };

  const mockNewOperatorAgent = {
    handleTransaction: jest.fn(),
  };

  const mockFunctionCallAgent = {
    handleTransaction: jest.fn(),
  };

  const mockTxEvent = createTransactionEvent({} as any);

  beforeAll(() => {
    handleTransaction = agent.provideHandleTransaction(mockNewGeneratorAgent, mockNewOperatorAgent, mockFunctionCallAgent);
  });

  describe("handleTransaction", () => {
    it("returns empty findings if there are no NewRandomGenerator events", async () => {

      mockTxEvent.filterLog = jest.fn().mockReturnValue([]);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
      expect(mockTxEvent.filterLog).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterLog).toHaveBeenCalledWith(
        events.NewRandomGenerator,
        PanCakeSwapLottery_Address
      );
    });

/*     it("returns a finding if there is a Tether transfer over 10,000", async () => {
      const mockTetherTransferEvent = {
        args: {
          from: "0xabc",
          to: "0xdef",
          value: ethers.BigNumber.from("20000000000"), //20k with 6 decimals
        },
      };
      mockTxEvent.filterLog = jest
        .fn()
        .mockReturnValue([mockTetherTransferEvent]);

      const findings = await handleTransaction(mockTxEvent);

      const normalizedValue = mockTetherTransferEvent.args.value.div(
        10 ** TETHER_DECIMALS
      );
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "High Tether Transfer",
          description: `High amount of USDT transferred: ${normalizedValue}`,
          alertId: "FORTA-1",
          severity: FindingSeverity.Low,
          type: FindingType.Info,
          metadata: {
            to: mockTetherTransferEvent.args.to,
            from: mockTetherTransferEvent.args.from,
          },
        }),
      ]);
      expect(mockTxEvent.filterLog).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterLog).toHaveBeenCalledWith(
        ERC20_TRANSFER_EVENT,
        TETHER_ADDRESS
      );
    }); */
  });
});
