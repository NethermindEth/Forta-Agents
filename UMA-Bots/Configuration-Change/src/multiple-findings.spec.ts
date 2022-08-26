import { HandleTransaction, TransactionEvent, keccak256 } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import {
  getFindingInstance,
  getEventMetadataFromAbi,
  HUBPOOL_MONITORED_EVENTS,
  SPOKEPOOL_MONITORED_EVENTS,
} from "./utils";
import { provideHandleTransaction } from "./agent";
import { createAddress, NetworkManager } from "forta-agent-tools";
import { NetworkDataInterface } from "./network";

const RANDOM_ADDRESSES = [createAddress("0x12"), createAddress("0x54")];
const TRANSFER_EVENT_ABI = "event Transfer(address,uint)";
const TEST_HUBPOOL_ADDR: string = createAddress("0x23");
const TEST_SPOKEPOOL_ADDR: string = createAddress("0x46");
const EMPTY_ADDRESS = createAddress("0x00");
const MOCK_NM_DATA: Record<number, NetworkDataInterface> = {
  0: { addresses: [TEST_SPOKEPOOL_ADDR, TEST_HUBPOOL_ADDR] },
};
const MOCK_L2_NM_DATA: Record<number, NetworkDataInterface> = {
  0: { addresses: [TEST_SPOKEPOOL_ADDR] },
};

describe("Detection of HubPool events on L1", () => {
  const networkManagerTest = new NetworkManager(MOCK_NM_DATA, 0);

  let handleTransaction: HandleTransaction = provideHandleTransaction(
    HUBPOOL_MONITORED_EVENTS,
    networkManagerTest,
    SPOKEPOOL_MONITORED_EVENTS
  );

  it("returns N findings for N HubPool related events (N>=1)", async () => {
    const passedParams = ["123", "0x12ab"];

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(HUBPOOL_MONITORED_EVENTS[10], TEST_HUBPOOL_ADDR, passedParams)
      .addEventLog(HUBPOOL_MONITORED_EVENTS[0], TEST_HUBPOOL_ADDR, ["123"]);

    let thisFindingMetadataEvent1 = getEventMetadataFromAbi(HUBPOOL_MONITORED_EVENTS[10], passedParams);
    let thisFindingMetadataEvent2 = getEventMetadataFromAbi(HUBPOOL_MONITORED_EVENTS[0], ["123"]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      getFindingInstance(true, thisFindingMetadataEvent1),
      getFindingInstance(true, thisFindingMetadataEvent2),
    ]);
  });

  it("returns N findings for N SpokePool related events (N>=1)", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(SPOKEPOOL_MONITORED_EVENTS[0], TEST_SPOKEPOOL_ADDR, [RANDOM_ADDRESSES[0]])
      .addEventLog(SPOKEPOOL_MONITORED_EVENTS[3], TEST_SPOKEPOOL_ADDR, ["123"])
      .addEventLog(TRANSFER_EVENT_ABI, TEST_SPOKEPOOL_ADDR, [RANDOM_ADDRESSES[0], "123"]);

    let thisFindingMetadataEvent1 = getEventMetadataFromAbi(SPOKEPOOL_MONITORED_EVENTS[0], [RANDOM_ADDRESSES[0]]);
    let thisFindingMetadataEvent2 = getEventMetadataFromAbi(SPOKEPOOL_MONITORED_EVENTS[3], ["123"]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      getFindingInstance(false, thisFindingMetadataEvent1),
      getFindingInstance(false, thisFindingMetadataEvent2),
    ]);
  });

  it("returns findings when both HubPool and SpokePool configurations change in one transaction", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(SPOKEPOOL_MONITORED_EVENTS[0], TEST_SPOKEPOOL_ADDR, [RANDOM_ADDRESSES[0]])
      .addEventLog(HUBPOOL_MONITORED_EVENTS[10], TEST_HUBPOOL_ADDR, ["123", "0x12ab"])
      .addEventLog(HUBPOOL_MONITORED_EVENTS[0], TEST_HUBPOOL_ADDR, ["123"]);

    let thisFindingMetadataEvent1 = getEventMetadataFromAbi(HUBPOOL_MONITORED_EVENTS[10], ["123", "0x12ab"]);
    let thisFindingMetadataEvent2 = getEventMetadataFromAbi(HUBPOOL_MONITORED_EVENTS[0], ["123"]);
    let thisFindingMetadataEvent3 = getEventMetadataFromAbi(SPOKEPOOL_MONITORED_EVENTS[0], [RANDOM_ADDRESSES[0]]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      getFindingInstance(true, thisFindingMetadataEvent1),
      getFindingInstance(true, thisFindingMetadataEvent2),
      getFindingInstance(false, thisFindingMetadataEvent3),
    ]);
  });
});

describe("(Non)Detection of HubPool events on L2", () => {
  const networkManagerTest = new NetworkManager(MOCK_L2_NM_DATA, 0);

  let handleTransaction: HandleTransaction = provideHandleTransaction(
    HUBPOOL_MONITORED_EVENTS,
    networkManagerTest,
    SPOKEPOOL_MONITORED_EVENTS
  );

  it("doesn't return any findings for HubPool relevant events on L2's", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(EMPTY_ADDRESS)
      .addEventLog(HUBPOOL_MONITORED_EVENTS[0], EMPTY_ADDRESS, ["123"]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns findings only related to SpokePools on L2's", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(EMPTY_ADDRESS)
      .addEventLog(HUBPOOL_MONITORED_EVENTS[0], EMPTY_ADDRESS, ["123"]) // no finding shall be generated for this event
      .addEventLog(SPOKEPOOL_MONITORED_EVENTS[0], TEST_SPOKEPOOL_ADDR, [RANDOM_ADDRESSES[0]]);

    const findings = await handleTransaction(txEvent);
    let thisFindingMetadata = getEventMetadataFromAbi(SPOKEPOOL_MONITORED_EVENTS[0], [RANDOM_ADDRESSES[0]]);
    expect(findings).toStrictEqual([getFindingInstance(false, thisFindingMetadata)]);
  });
});
