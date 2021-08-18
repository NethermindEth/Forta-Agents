import {
  EventType,
  Finding,
  Network,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { Log } from "forta-agent/dist/sdk/receipt";
import agent, { EVENTS } from ".";
import { EventData } from "./event.data";
import { utils } from 'ethers';

const addresses: string[] = [
  "0x0f51bb10119727a7e5ea3538074fb341f56b09ad",
  "0x00000000219ab540356cbb839cbe05303d7705fa",
  "0x00000000219ab540356cbb839cbe05303d7705fa",
];

type Param = string | number;

const getType = (param: Param): string => {
  if(typeof param === "string")
    return "address";
  return "uint256";
};

const toHex = (param: Param): string => 
  utils.defaultAbiCoder.encode([getType(param)], [param]);

const buildLogForGnosisSafeEvent = (signature:string, param: Param) : Log => {
    const topics : string[] = [
        utils.id(signature),
        toHex(param),
    ];
    return {
        topics: topics,
    } as Log;
};

const createTxEvent = (logs : Log[]): TransactionEvent => {
  const tx = { } as any;
  const receipt = { logs } as any;
  const block = { } as any;
  const eventAddresses = { } as any;
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

const generateTests = (
  event: EventData, 
  params: Param[]
): [Log[], Finding[]] => {
  const logs: Log[] = [];
  const findings: Finding[] = [];
  
  params.forEach((p: Param) => {
    logs.push(buildLogForGnosisSafeEvent(event.signature, p));
    findings.push(event.createFinding(toHex(p)));
  });

  return [logs, findings];
}

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
      const [addLogs, addFindings] = generateTests(
        EVENTS[0],
        addresses,
      );
      // Create logs & findings for RemoveOwner event
      const [remLogs, remFindings] = generateTests(
        EVENTS[1],
        addresses,
      );
      // Create logs & findings for ChangedThreshold event
      const [thrLogs, thrFindings] = generateTests(
        EVENTS[2],
        [50, 20, 1],
      );
      
      const txnEvent: TransactionEvent = createTxEvent([
        ...remLogs, 
        ...thrLogs,
        ...addLogs,
      ]);
      const findings: Finding[] = await handleTransaction(txnEvent);
      expect(findings).toStrictEqual([
        ...addFindings,
        ...remFindings,
        ...thrFindings,
      ]);
    });
  });
});
