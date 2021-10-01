import {
  EventType,
  Finding,
  FindingSeverity,
  FindingType,
  Network,
  HandleTransaction,
  TransactionEvent
} from "forta-agent";
import { Log } from "forta-agent/dist/sdk/receipt";
import {
  zeroAddress,
  keccakFromString,
  bufferToHex,
  addHexPrefix,
  stripHexPrefix
} from "ethereumjs-util";
import agent, { OWNERSHIP_TRANSFERRED_EVENT_SIGNATURE } from ".";

const testAddress1 = "0x0f51bb10119727a7e5ea3538074fb341f56b09ad";
const testAddress2 = "0x00000000219ab540356cbb839cbe05303d7705fa";

const addressStrToBytes32Str = (address: string): string => {
  return addHexPrefix("0".repeat(24) + stripHexPrefix(address));
};

const buildLogForOwnershipTransferenceEvent = (
  from: string,
  to: string
): Log => {
  const topics: string[] = [
    bufferToHex(keccakFromString(OWNERSHIP_TRANSFERRED_EVENT_SIGNATURE)),
    addressStrToBytes32Str(from),
    addressStrToBytes32Str(to)
  ];
  return {
    topics: topics
  } as Log;
};
const createTxEvent = (logs: Log[]): TransactionEvent => {
  const tx = {} as any;
  const receipt = { logs } as any;
  const block = {} as any;
  const eventAddresses = {} as any;
  return new TransactionEvent(
    EventType.BLOCK,
    Network.MAINNET,
    tx,
    receipt,
    [],
    eventAddresses,
    block
  );
};

describe("trasnferred ownership agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  describe("handleTransaction", () => {
    it("Returns empty findings if there is no OwnershipTransferred event", async () => {
      const txnEvent: TransactionEvent = createTxEvent([]);
      const findings: Finding[] = await handleTransaction(txnEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Returns empty findings if there is no OwnershipTransferred event from a non zero address", async () => {
      const log: Log = buildLogForOwnershipTransferenceEvent(
        zeroAddress(),
        testAddress1
      );
      const txnEvent: TransactionEvent = createTxEvent([log]);
      const findings: Finding[] = await handleTransaction(txnEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Returns finding if there is an OwnershipTrasferred event from a non zero address", async () => {
      const log: Log = buildLogForOwnershipTransferenceEvent(
        testAddress1,
        testAddress2
      );
      const txnEvent: TransactionEvent = createTxEvent([log]);
      const findings: Finding[] = await handleTransaction(txnEvent);
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Ownership Transfer Detection",
          description: "The ownership transfer is detected.",
          alertId: "NETHFORTA-4",
          severity: FindingSeverity.High,
          type: FindingType.Suspicious,
          metadata: {
            from: testAddress1,
            to: testAddress2
          }
        })
      ]);
    });
  });
});
