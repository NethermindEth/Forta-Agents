import {
  TransactionEvent,
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  EventType,
  Network,
} from "forta-agent";
import agent from ".";

describe("high gas agent", () => {
  let handleTransaction: HandleTransaction;
  const createTxEvent = ({ gasUsed }: any) => {
    const tx = {} as any;
    const receipt = { gasUsed } as any;
    const block = {} as any;
    const addresses = {} as any;
    return new TransactionEvent(
      EventType.BLOCK,
      Network.MAINNET,
      tx,
      receipt,
      [],
      addresses,
      block
    );
  };

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  describe("handleTransaction", () => {
    it("make just one call to the contract, should return an empty array with no errors.", async () => {
      const txEvent = createTxEvent({
        gasUsed: "1",
      });

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns a warning when making more than one calls to initialize function", async () => {
      const txEvent = createTxEvent({
        gasUsed: "1000001",
      });

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "High Gas Used",
          description: `Gas Used: ${txEvent.gasUsed}`,
          alertId: "FORTA-1",
          type: FindingType.Suspicious,
          severity: FindingSeverity.Medium,
        }),
      ]);
    });
  });
});
