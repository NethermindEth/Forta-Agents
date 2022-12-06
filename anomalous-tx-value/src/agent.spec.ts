import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  Network
} from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { provideHandleTransaction } from "./agent";
import { AgentConfig, NetworkData } from "./utils";

const DECIMALS = 10 ** 18;
const DEFAULT_CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    threshold: `${100 * DECIMALS}`
  }
};

describe("Detect Very High Txn Value", () => {
  let handleTransaction: HandleTransaction;
  let networkManager: NetworkManager<NetworkData>;

  beforeAll(() => {
    networkManager = new NetworkManager(DEFAULT_CONFIG, Network.MAINNET);
    handleTransaction = provideHandleTransaction(networkManager);
  });

  describe("Handle Transaction", () => {
    it("returns empty findings if value is below threshold", async () => {
      const txEvent = new TestTransactionEvent();

      txEvent.setValue(`${1 * DECIMALS}`);
      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if value is equal to threshold", async () => {
      const txEvent = new TestTransactionEvent();

      txEvent.setValue(`${100 * DECIMALS}`);

      const findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("returns a findings if value is above threshold", async () => {
      const txEvent = new TestTransactionEvent();
      const value = 101 * DECIMALS;

      txEvent.setValue(`${value}`);

      const findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "High Value Use Detection",
          description: "High value is used.",
          alertId: "NETHFORTA-2",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
            value: value.toString()
          }
        })
      ]);
    });
  });
});
