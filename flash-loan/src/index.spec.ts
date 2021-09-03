import {
  EventType,
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  Network,
  TransactionEvent,
} from "forta-agent";
import agent from ".";

describe("flash loan agent", () => {
  let handleTransaction: HandleTransaction;
  const mockWeb3 = {
    eth: {
      getBalance: jest.fn(),
    },
  } as any;
  const createTxEvent = ({ gasUsed, addresses, logs, blockNumber }: any) => {
    const tx = {} as any;
    const receipt = { gasUsed, logs } as any;
    const block = { number: blockNumber } as any;
    const addressez = { ...addresses } as any;
    return new TransactionEvent(
      EventType.BLOCK,
      Network.GOERLI,
      tx,
      receipt,
      [],
      addressez,
      block
    );
  };

  beforeAll(() => {
    handleTransaction = agent.provideHandleTransaction(mockWeb3);
  });

  describe("handleTransaction", () => {
    it("returns empty findings if gas used is below threshold", async () => {
      const txEvent = createTxEvent({ gasUsed: "1" });

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns a finding if a flash loan attack is detected", async () => {
      const flashLoanTopic =
        "0x631042c832b07452973831137f2d73e395028b44b250dedc5abb0ee766e168ac";
      const flashLoanEvent = {
        topics: [flashLoanTopic],
      };
      const protocolAddress = "0xacd43e627e64355f1861cec6d3a6688b31a6f952";
      const blockNumber = 100;
      const txEvent = createTxEvent({
        gasUsed: "7000001",
        addresses: {
          "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9": true,
          [protocolAddress]: true,
        },
        logs: [flashLoanEvent],
        blockNumber,
      });
      const currentBalance = "1";
      const previousBalance = "200000000000000000001";
      const balanceDiff = "200000000000000000000";
      mockWeb3.eth.getBalance.mockReturnValueOnce(currentBalance);
      mockWeb3.eth.getBalance.mockReturnValueOnce(previousBalance);

      const findings = await handleTransaction(txEvent);

      expect(mockWeb3.eth.getBalance).toHaveBeenCalledTimes(2);
      expect(mockWeb3.eth.getBalance).toHaveBeenNthCalledWith(
        1,
        protocolAddress,
        blockNumber
      );
      expect(mockWeb3.eth.getBalance).toHaveBeenNthCalledWith(
        2,
        protocolAddress,
        blockNumber - 1
      );
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Flash Loan with Loss",
          description: `Flash Loan with loss of ${balanceDiff} detected for ${protocolAddress}`,
          alertId: "NETHFORTA-6",
          protocol: "aave",
          type: FindingType.Suspicious,
          severity: FindingSeverity.High,
          metadata: {
            protocolAddress,
            balanceDiff,
            loans: JSON.stringify([flashLoanEvent]),
          },
        }),
      ]);
    });
  });
});
