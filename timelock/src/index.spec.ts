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

const ganache = require("ganache-core");
const provider = ganache.provider();
const mockWeb3 = new Web3(provider);

describe("flash loan agent", () => {
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
      const eventSignature = mockWeb3.eth.abi.encodeEventSignature(
        timelockEvents[0]
      );

      const timeLockEvent = {
        topics: [eventSignature],
      };

      const txEvent = createTxEvent({
        gasUsed: "7000000",
        logs: [timeLockEvent],
      });

      const findings = await handleTransaction(txEvent);

      expect(findings.length).toStrictEqual(1);
    });

    it("returns a findings of a multiple timelock event emission", async () => {
      const eventSignature = mockWeb3.eth.abi.encodeEventSignature(
        timelockEvents[0]
      );
      const eventSignature2 = mockWeb3.eth.abi.encodeEventSignature(
        timelockEvents[1]
      );
      const eventSignature3 = mockWeb3.eth.abi.encodeEventSignature(
        timelockEvents[2]
      );

      const eventSignature4 = mockWeb3.eth.abi.encodeEventSignature(
        timelockEvents[3]
      );

      const timeLockEvent = {
        topics: [
          eventSignature,
          eventSignature2,
          eventSignature3,
          eventSignature4,
        ],
      };

      const txEvent = createTxEvent({
        gasUsed: "7000000",
        logs: [timeLockEvent],
      });

      const findings = await handleTransaction(txEvent);

      expect(findings.length).toStrictEqual(4);
    });
  });
});
