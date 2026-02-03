import {
  TransactionEvent,
  FindingType,
  FindingSeverity,
  Finding,
  EventType,
  Network,
  HandleTransaction
} from "forta-agent";

import agent, {
  generateHash,
  UPGRADE_EVENT_SIGNATURE,
  CONTRACT_ADDRESS
} from ".";

describe("Detect Upgrade Events", () => {
  let handleTransaction: HandleTransaction;

  const createTxEvent = ({ logs, addresses }: any): TransactionEvent => {
    const tx: any = {};
    const receipt: any = { logs };
    const block: any = {};
    const address: any = { CONTRACT_ADDRESS, ...addresses };

    return new TransactionEvent(
      EventType.BLOCK,
      Network.MAINNET,
      tx,
      receipt,
      [],
      address,
      block
    );
  };

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  describe("handleTransaction", () => {
    it("should return empty finding", async () => {
      const upgradeEvent = {
        topics: [],
        address: undefined
      };

      const txEvent = createTxEvent({
        logs: [upgradeEvent]
      });

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });
    it("returns a finding when upgrade event detected", async () => {
      const upgradeEventTopic: string = generateHash(UPGRADE_EVENT_SIGNATURE);

      // `Upgraded(address indexed implementation)` puts the implementation in topics[1]
      const newImpl = "0x2000000000000000000000000000000000000002";
      const implTopic = "0x" + "0".repeat(24) + newImpl.slice(2);

      const upgradeEvent = {
        topics: [upgradeEventTopic, implTopic],
        address: "0x1000000000000000000000000000000000000001"
      };

      const txEvent = createTxEvent({
        logs: [upgradeEvent]
      });

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Upgrade Event Detection",
          description: `Upgrade event detected for proxy 0x1000000000000000000000000000000000000001`,
          alertId: "NETHFORTA-5",
          type: FindingType.Suspicious,
          severity: FindingSeverity.High,
          metadata: {
            proxy: "0x1000000000000000000000000000000000000001",
            newImplementation: newImpl,
            caller: "",
            txHash: ""
          }
        })
      ]);
    });
    it("should return empty finding for  contract address", async () => {
      const upgradeEventTopic: string = generateHash(UPGRADE_EVENT_SIGNATURE);

      const upgradeEvent = {
        topics: [upgradeEventTopic],
        address: undefined
      };

      const txEvent = createTxEvent({
        logs: [upgradeEvent]
      });

      const findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("dedupes multiple identical upgrade logs in a single transaction", async () => {
      const upgradeEventTopic: string = generateHash(UPGRADE_EVENT_SIGNATURE);
      const newImpl = "0x2000000000000000000000000000000000000002";
      const implTopic = "0x" + "0".repeat(24) + newImpl.slice(2);

      const upgradeEvent = {
        topics: [upgradeEventTopic, implTopic],
        address: "0x1000000000000000000000000000000000000001"
      };

      const txEvent = createTxEvent({
        logs: [upgradeEvent, upgradeEvent]
      });

      const findings = await handleTransaction(txEvent);
      expect(findings.length).toBe(1);
    });
  });
});
