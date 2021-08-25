import { BlockEvent, EventType, Finding, FindingSeverity, FindingType, HandleBlock, Network, HandleTransaction, TransactionEvent } from "forta-agent"
import agent, { MEDIUM_GAS_THRESHOLD, HIGH_GAS_THRESHOLD } from "."


const createTxEvent  = ({ gasUsed, addresses, logs, blockNumber } : any) : TransactionEvent => {
  const tx = { } as any;
  const receipt = { gasUsed, logs } as any;
  const block = { number: blockNumber } as any;
  const eventAddresses = { ...addresses } as any;
  return new TransactionEvent(EventType.BLOCK, Network.MAINNET, tx, receipt, [], eventAddresses, block);
}


describe("multi gas threshold agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  })

  describe("handleTransaction", () => {

    it("Returns empty findings if gas used is below lowest threshold", async () => {
      const txEvent: TransactionEvent = createTxEvent({ gasUsed: "500000" });
      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([])
    })

    it("Returns finding with severity Medium if gas used is between 1000000 and 3000000", async () => {
      const txEvent: TransactionEvent = createTxEvent({ gasUsed: MEDIUM_GAS_THRESHOLD });
      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "High Gas Used",
          description: `Gas Used: ${MEDIUM_GAS_THRESHOLD}`,
          alertId: "NETHFORTA-1",
          severity: FindingSeverity.Medium,
          type: FindingType.Suspicious,
        })
      ]);
    });

    it("Returns finding with severity High if gas used is greater than or equal to 3000000", async () => {
      const txEvent: TransactionEvent = createTxEvent({ gasUsed: HIGH_GAS_THRESHOLD});
      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "High Gas Used",
          description: `Gas Used: ${HIGH_GAS_THRESHOLD}`,
          alertId: "NETHFORTA-1",
          severity: FindingSeverity.High,
          type: FindingType.Suspicious,
        })
      ]);
    });

    it("Returns empty findings if gasUsed is undefined", async () => {
      const txEvent: TransactionEvent = createTxEvent({});
      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

  })
})