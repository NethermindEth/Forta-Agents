import {
  Finding,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import agent, {
  YFI_ADDRESS,
  createFinding,
} from "./agent";
import {
  createAddress,
  TestTransactionEvent,
  encodeFunctionCall,
} from 'nethermindeth-general-agents-module';

const createMetadata = (
  from: string,
  newOwner:string, 
  to: string = YFI_ADDRESS
): any => {
  return {
    from: from,
    to: to,
    input: encodeFunctionCall({
      name: 'setGovernance',
      type: 'function',
      inputs: [{
        type: 'address',
        name: 'owner',
      }],
    }, [newOwner]),
  };
};

describe("YFI governance changes agent tests suit", () => {
  let handleTransaction: HandleTransaction = agent.handleTransaction;

  describe("handleTransaction", () => {
    it("Should return empty findings if no governance change occured", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent();

      const findings: Finding[] = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([])
    });

    it("Should ignore governance changes not in YFI", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .addTrace(createMetadata(
          createAddress("0x1"),
          createAddress("0x2"),
          createAddress("0xdead"),
        ))
        .addTrace(createMetadata(
          createAddress("0x3"),
          createAddress("0x4"),
          createAddress("0x0"),
        ));

      const findings: Finding[] = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([])
    });

    it("Should detect governance changes", async () => {
      const meta1 = createMetadata(
        createAddress("0x1"), 
        createAddress("0x2"),
      );
      const meta2 = createMetadata(
        createAddress("0x2"), 
        createAddress("0x3"),
      );
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .addTrace(meta1).addTrace(meta2);

      const findings: Finding[] = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        createFinding(meta1),
        createFinding(meta2),
      ])
    });
  });
});
