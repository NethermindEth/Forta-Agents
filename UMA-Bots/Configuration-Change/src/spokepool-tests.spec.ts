import { HandleTransaction, TransactionEvent, keccak256 } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { getEventMetadataFromAbi, HUBPOOL_MONITORED_EVENTS, SPOKEPOOL_MONITORED_EVENTS } from "./utils";
import { provideHandleTransaction } from "./agent";
import { getFindingInstance } from "./helpers";
import { createAddress, NetworkManager } from "forta-agent-tools";
import { NetworkDataInterface } from "./network";

const RANDOM_ADDRESSES = [createAddress("0x12"), createAddress("0x54")];
const TRANSFER_EVENT_ABI = "event Transfer(address,uint)";
const TEST_HUBPOOL_ADDR: string = createAddress("0x23");
const TEST_SPOKEPOOL_ADDR: string = createAddress("0x46");
const MOCK_NM_DATA: Record<number, NetworkDataInterface> = {
  0: { hubPoolAddr: TEST_HUBPOOL_ADDR, spokePoolAddr: TEST_SPOKEPOOL_ADDR },
};

const networkManagerTest = new NetworkManager(MOCK_NM_DATA, 0);

describe("SpokePool configuration changes detection bot", () => {
  let handleTransaction: HandleTransaction = provideHandleTransaction(
    HUBPOOL_MONITORED_EVENTS,
    networkManagerTest,
    SPOKEPOOL_MONITORED_EVENTS
  );

  it("returns empty findings if there is no relevant event", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().setFrom(TEST_SPOKEPOOL_ADDR);
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("doesn't return a finding if a relevant event is emitted from a non-SpokePool address", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      SPOKEPOOL_MONITORED_EVENTS[0],
      RANDOM_ADDRESSES[0],
      [RANDOM_ADDRESSES[1]]
    );

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("doesn't return a finding if an irrelevant event is made from the SpokePool address", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(TRANSFER_EVENT_ABI, TEST_SPOKEPOOL_ADDR, [
      RANDOM_ADDRESSES[0],
      "123",
    ]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns a finding for emitted monitored event from SpokePool : Event SetXDomainAdmin", async () => {
    const passedParams = [RANDOM_ADDRESSES[0]];
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(SPOKEPOOL_MONITORED_EVENTS[0], TEST_SPOKEPOOL_ADDR, passedParams);

    const findings = await handleTransaction(txEvent);
    let thisFindingMetadata = getEventMetadataFromAbi(SPOKEPOOL_MONITORED_EVENTS[0], passedParams);
    expect(findings).toStrictEqual([getFindingInstance(thisFindingMetadata)]);
  });


  it("returns a finding for emitted monitored event from SpokePool : Event SetHubPool", async () => {
    const passedParams = [RANDOM_ADDRESSES[0]];
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(SPOKEPOOL_MONITORED_EVENTS[1], TEST_SPOKEPOOL_ADDR, passedParams);

    const findings = await handleTransaction(txEvent);
    let thisFindingMetadata = getEventMetadataFromAbi(SPOKEPOOL_MONITORED_EVENTS[1], passedParams);
    expect(findings).toStrictEqual([getFindingInstance(thisFindingMetadata)]);
  });

  it("returns a finding for emitted monitored event from SpokePool : Event EnabledDepositRoute", async () => {
    const passedParams = [RANDOM_ADDRESSES[0], "123", true];
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(SPOKEPOOL_MONITORED_EVENTS[2], TEST_SPOKEPOOL_ADDR, passedParams);

    const findings = await handleTransaction(txEvent);
    let thisFindingMetadata = getEventMetadataFromAbi(SPOKEPOOL_MONITORED_EVENTS[2], passedParams);
    expect(findings).toStrictEqual([getFindingInstance(thisFindingMetadata)]);
  });

  it("returns a finding for emitted monitored event from SpokePool : Event EnabledDepositRoute", async () => {
    const passedParams = ["123"];
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(SPOKEPOOL_MONITORED_EVENTS[3], TEST_SPOKEPOOL_ADDR, passedParams);

    const findings = await handleTransaction(txEvent);
    let thisFindingMetadata = getEventMetadataFromAbi(SPOKEPOOL_MONITORED_EVENTS[3], passedParams);
    expect(findings).toStrictEqual([getFindingInstance(thisFindingMetadata)]);
  });



  it("returns N findings for N events (N>=1)", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(SPOKEPOOL_MONITORED_EVENTS[0], TEST_SPOKEPOOL_ADDR, [RANDOM_ADDRESSES[0]])
      .addEventLog(SPOKEPOOL_MONITORED_EVENTS[3], TEST_SPOKEPOOL_ADDR, ["123"]);

    let thisFindingMetadataEvent1 = getEventMetadataFromAbi(SPOKEPOOL_MONITORED_EVENTS[0], [RANDOM_ADDRESSES[0]]);
    let thisFindingMetadataEvent2 = getEventMetadataFromAbi(SPOKEPOOL_MONITORED_EVENTS[3], ["123"]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      getFindingInstance(thisFindingMetadataEvent1),
      getFindingInstance(thisFindingMetadataEvent2),
    ]);
  });
});
