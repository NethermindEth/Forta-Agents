jest.useFakeTimers();
import {
  EventType,
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  Network,
  TransactionEvent,
} from "forta-agent";
import agent, { timelockEvents } from ".";

import Web3 from "web3";
import ganache from "ganache-core";
const provider: any = ganache.provider();
const web3 = new Web3(provider);

function generateEvent(value) {
  const eventSignature = web3.eth.abi.encodeEventSignature(value);
  const timeLockEvent = { topics: [eventSignature] };
  return timeLockEvent;
}

function createFinding(eventSignature): Finding {
  return Finding.fromObject({
    name: "TimeLock",
    description: "TimeLock initiated",
    alertId: "NETHFORTA-7",
    severity: FindingSeverity.Low,
    type: FindingType.Suspicious,
    metadata: {
      events: JSON.stringify(eventSignature),
    },
  });
}

describe("Timelock agent", () => {
  let handleTransaction: HandleTransaction;

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
    handleTransaction = agent.handleTransaction;
  });

  describe("handleTransaction", () => {
    it("returns empty findings if gas used is below threshold", async () => {
      const txEvent = createTxEvent({ gasUsed: "1" });
      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns a finding of a timelock event emission", async () => {
      const txEvent = createTxEvent({
        gasUsed: "7000000",
        logs: [generateEvent(timelockEvents[0])],
      });

      const findings = await handleTransaction(txEvent);

      expect(findings.length).toBe(1);
      expect(findings).toStrictEqual([createFinding(timelockEvents[0])]);
    });

    it("returns a findings of a multiple timelock event emission", async () => {
      const txEvent = createTxEvent({
        gasUsed: "7000000",
        logs: [
          generateEvent(timelockEvents[0]),
          generateEvent(timelockEvents[1]),
          generateEvent(timelockEvents[2]),
          generateEvent(timelockEvents[3]),
        ],
      });

      const findings = await handleTransaction(txEvent);

      const expectedFindings = timelockEvents.map((timelockEvent) =>
        createFinding(timelockEvent)
      );

      expect(findings).toStrictEqual(expectedFindings);
      expect(findings.length).toBe(4);
    });
  });
});
