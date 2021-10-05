import {
  EventType,
  Finding,
  Network,
  HandleTransaction,
  TransactionEvent,
  Log,
  Receipt,
  Transaction,
  Block
} from "forta-agent";
import agent, { EVENTS } from ".";
import { Event } from "./event.data";
import { utils } from "ethers";

const addresses: string[] = [
  "0x0f51bb10119727a7e5ea3538074fb341f56b09ad",
  "0x00000000219ab540356cbb839cbe05303d7705fa",
  "0x00000000219ab540356cbb839cbe05303d7705fa"
];

type Param = string | number;

const getType = (param: Param): string => {
  if (typeof param === "string") return "address";
  return "uint256";
};

const toHex = (param: Param): string =>
  utils.defaultAbiCoder.encode([getType(param)], [param]);

const buildLogForGnosisSafeEvent = (signature: string, param: Param): Log => {
  return {
    topics: [utils.id(signature)],
    data: toHex(param)
  } as Log;
};

const createTxEvent = (logs: Log[]): TransactionEvent => {
  const tx: Transaction = {} as Transaction;
  const receipt: Receipt = { logs } as Receipt;
  const block: Block = {} as Block;
  return new TransactionEvent(
    EventType.BLOCK,
    Network.MAINNET,
    tx,
    receipt,
    [],
    {},
    block
  );
};

const generateTestData = (
  event: Event,
  params: Param[]
): [Log[], Finding[]] => {
  const logs: Log[] = [];
  const findings: Finding[] = [];

  params.forEach((p: Param) => {
    logs.push(buildLogForGnosisSafeEvent(event.signature, p));
    findings.push(event.createFinding(toHex(p)));
  });

  return [logs, findings];
};

describe("Gnosis Safe admin changes agent test suit", () => {
  const handleTransaction: HandleTransaction = agent.handleTransaction;

  describe("handleTransaction", () => {
    it("Should returns empty findings if there is no Gnosis Safe events", async () => {
      const txnEvent: TransactionEvent = createTxEvent([]);
      const findings: Finding[] = await handleTransaction(txnEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Should detect multiple Gnosis Safe events", async () => {
      // Create logs & findings for AddOwner event
      const [addLogs, addFindings] = generateTestData(EVENTS[0], addresses);
      // Create logs & findings for RemoveOwner event
      const [remLogs, remFindings] = generateTestData(EVENTS[1], addresses);
      // Create logs & findings for ChangedThreshold event
      const [thrLogs, thrFindings] = generateTestData(EVENTS[2], [50, 20, 1]);

      const txnEvent: TransactionEvent = createTxEvent([
        ...remLogs,
        ...thrLogs,
        ...addLogs
      ]);
      const findings: Finding[] = await handleTransaction(txnEvent);
      expect(findings).toStrictEqual([
        ...addFindings,
        ...remFindings,
        ...thrFindings
      ]);
    });
  });
});
