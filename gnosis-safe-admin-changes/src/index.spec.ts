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

interface TestData{
  event: EventData,
  param: Param,
};

const getType = (param: Param): string => {
  if(typeof param === "string")
    return "address";
  return "uint256";
};

const toHex = (param: Param): string => 
  utils.defaultAbiCoder.encode([getType(param)], [param]);

const buildLogForGnosisSafeEvent = ({event, param}: TestData) : Log => {
    const topics : string[] = [
        utils.id(event.signature),
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

describe("Gnosis Safe admin changes agent test suit", () => {
  const handleTransaction: HandleTransaction = agent.handleTransaction;

  describe("handleTransaction", () => {
    it("Should returns empty findings if there is no Gnosis Safe events", async () => {
      const txnEvent: TransactionEvent = createTxEvent([]);
      const findings: Finding[] = await handleTransaction(txnEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Should detect multiple Gnosis Safe events", async () => {
      const testCases: TestData[] = [];
      const addEvents: Finding[] = [];
      const remEvents: Finding[] = [];
      const thrEvents: Finding[] = [];
      
      const addTest = (data: Param[]): TestData[] => 
        EVENTS.map(
          (e: EventData, i: number): TestData => {
            return {
              event: e,
              param: data[i],
            };
          }
        );

      const addFinding = (data: Param[]): Finding[] =>
        EVENTS.map(
          (e: EventData, i: number): Finding => 
            e.handler(toHex(data[i]))
        );

      const newTest = (data: Param[]): void => {
        testCases.push(...addTest(data));
        const [add, rem, thr] = addFinding(data);
        addEvents.push(add);
        remEvents.push(rem);
        thrEvents.push(thr);
      };

      newTest([addresses[0], addresses[1], 20]);
      newTest([addresses[2], addresses[2], 5]);

      const logs: Log[] = testCases.map(
        (tc: TestData) => buildLogForGnosisSafeEvent(tc)
      );
      
      const txnEvent: TransactionEvent = createTxEvent(logs);
      const findings: Finding[] = await handleTransaction(txnEvent);
      expect(findings).toStrictEqual([
        ...addEvents,
        ...remEvents,
        ...thrEvents,
      ]);
    });
  });
});
