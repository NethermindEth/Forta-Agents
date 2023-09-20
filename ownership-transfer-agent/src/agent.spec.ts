import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";

import { zeroAddress } from "ethereumjs-util";
import { provideHandleTransaction } from "./agent";

import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools/lib";

const OWNERSHIP_TRANSFERRED_ABI: string =
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)";

const testContract = createAddress("0x1234");

describe("trasnferred ownership agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideHandleTransaction();
  });

  describe("handleTransaction", () => {
    it("Returns empty findings if there is no event", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent();
      const findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Returns empty findings if there is random event from a non zero address", async () => {
      const randomEvent = "event RandomEvent(address indexed previousOwner, address indexed newOwner)";

      const txEvent = new TestTransactionEvent().addEventLog(randomEvent, testContract, [
        createAddress("0x1"),
        createAddress("0x2"),
      ]);

      const findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Returns empty findings if there is ownership transfer event from a zero address", async () => {
      const txEvent = new TestTransactionEvent().addEventLog(OWNERSHIP_TRANSFERRED_ABI, testContract, [
        zeroAddress(),
        createAddress("0x2"),
      ]);

      const findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Returns findings if there is ownership transfer event from a non zero address", async () => {
      const txEvent = new TestTransactionEvent().addEventLog(OWNERSHIP_TRANSFERRED_ABI, testContract, [
        createAddress("0x1"),
        createAddress("0x2"),
      ]);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Ownership Transfer Detection",
          description: "The ownership transfer is detected.",
          alertId: "NETHFORTA-4",
          severity: FindingSeverity.High,
          type: FindingType.Suspicious,
          metadata: {
            from: createAddress("0x1"),
            to: createAddress("0x2"),
          },
          addresses: [createAddress("0x0"), createAddress("0x1"), createAddress("0x2")],
        }),
      ]);
    });
  });
});
