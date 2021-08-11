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

    it("returns a finding of a timelock event emission", async () => {});
  });
});
