import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent,
  ethers,
} from "forta-agent";
import agent, {
 PROPOSAL_CREATED_EVENT, provideInitialize
} from "./agent";

describe("high tether transfer agent", () => {
  let handleTransaction: HandleTransaction;
  const mockTxEvent = createTransactionEvent({} as any);
  let mockProvider = {
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 })
  }
  let initialize = provideInitialize(mockProvider as any)
  beforeAll(async () => {
    handleTransaction = agent.handleTransaction;
    await initialize();
  });

  describe("handleTransaction", () => {
    it("returns empty findings if there are no ProposalCreated events", async () => {
      mockTxEvent.filterLog = jest.fn().mockReturnValue([]);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
      expect(mockTxEvent.filterLog).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterLog).toHaveBeenCalledWith(
        PROPOSAL_CREATED_EVENT,
      );
    });

    it("returns empty findings if there is a ProposalCreated event but the value is under the ETH threshold", async () => {
      const mockProposalCreatedEvent = {
        args: {
          proposer: "0xabc",
          proposalId: "0xaaa",
          targets: ["0xdef"],
          amounts: [ethers.BigNumber.from("132")]
        },
      };
      mockTxEvent.filterLog = jest.fn().mockReturnValue([mockProposalCreatedEvent]);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
      expect(mockTxEvent.filterLog).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterLog).toHaveBeenCalledWith(
        PROPOSAL_CREATED_EVENT,
      );
    });


    it.only("returns a finding if there is a ProposalCreated event and the value is over the ETH threshold", async () => {
      const mockProposalCreatedEvent = {
        address: "0x123",
        args: {
          proposer: "0xabc",
          proposalId: "1",
          to: "0xdef",
          targets: ["0xaaa"],
          amounts:[ ethers.BigNumber.from("2222222220000000000")]
        },
      };
      mockTxEvent.filterLog = jest
        .fn()
        .mockReturnValue([mockProposalCreatedEvent]);


      const amountInEth = ethers.utils.formatEther(mockProposalCreatedEvent.args.amounts[0])
      const findings = await handleTransaction(mockTxEvent);

      
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Large Transfer Proposal Created",
            description: `A large transfer of ${amountInEth} ETH has been proposed in DAO ${mockProposalCreatedEvent.address}`,
            alertId: "LARGE-TRANSFER-PROPOSAL",
            severity: FindingSeverity.Medium,
            type: FindingType.Suspicious,
            metadata: {
              dao: mockProposalCreatedEvent.address,
              proposer: mockProposalCreatedEvent.args.proposer,
              proposalId: mockProposalCreatedEvent.args.proposalId,
              receiver: mockProposalCreatedEvent.args.targets[0],
              amount: amountInEth.toString(),
            },
        }),
      ]);
      expect(mockTxEvent.filterLog).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterLog).toHaveBeenCalledWith(
        PROPOSAL_CREATED_EVENT,
      );
    });
  });
});
