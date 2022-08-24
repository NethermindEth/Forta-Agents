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

describe("HubPool configuration changes detection bot", () => {
  let handleTransaction: HandleTransaction = provideHandleTransaction(
    HUBPOOL_MONITORED_EVENTS,
    networkManagerTest,
    SPOKEPOOL_MONITORED_EVENTS
  );

  it("returns empty findings if there is no relevant event", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().setFrom(TEST_HUBPOOL_ADDR);
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("doesn't return a finding if a relevant event is emitted from a non-HubPool address", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      HUBPOOL_MONITORED_EVENTS[0],
      RANDOM_ADDRESSES[0],
      ["123"]
    );

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("doesn't return a finding if an irrelevant event is made from the HubPool address", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(TRANSFER_EVENT_ABI, TEST_HUBPOOL_ADDR, [
      RANDOM_ADDRESSES[0],
      "123",
    ]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns a finding for emitted monitored event from HubPool : Event LivenessSet", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(TEST_HUBPOOL_ADDR)
      .addEventLog(HUBPOOL_MONITORED_EVENTS[0], TEST_HUBPOOL_ADDR, ["123"]);

    const findings = await handleTransaction(txEvent);
    let thisFindingMetadata = getEventMetadataFromAbi(HUBPOOL_MONITORED_EVENTS[0], ["123"]);
    expect(findings).toStrictEqual([getFindingInstance(thisFindingMetadata)]);
  });

  it("returns a finding for emitted monitored event from HubPool : Event ProtocolFeeCaptureSet", async () => {
    const passedParams = [RANDOM_ADDRESSES[0], "123"];
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(TEST_HUBPOOL_ADDR)
      .addEventLog(HUBPOOL_MONITORED_EVENTS[1], TEST_HUBPOOL_ADDR, passedParams);

    const findings = await handleTransaction(txEvent);
    let thisFindingMetadata = getEventMetadataFromAbi(HUBPOOL_MONITORED_EVENTS[1], passedParams);
    expect(findings).toStrictEqual([getFindingInstance(thisFindingMetadata)]);
  });

  it("returns a finding for emitted monitored event from HubPool : Event ProtocolFeesCapturedClaimed", async () => {
    const passedParams = [RANDOM_ADDRESSES[0], "123"];
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(TEST_HUBPOOL_ADDR)
      .addEventLog(HUBPOOL_MONITORED_EVENTS[2], TEST_HUBPOOL_ADDR, passedParams);

    const findings = await handleTransaction(txEvent);
    let thisFindingMetadata = getEventMetadataFromAbi(HUBPOOL_MONITORED_EVENTS[2], passedParams);
    expect(findings).toStrictEqual([getFindingInstance(thisFindingMetadata)]);
  });

  it("returns a finding for emitted monitored event from HubPool : Event BondSet", async () => {
    const passedParams = [RANDOM_ADDRESSES[0], "123"];
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(TEST_HUBPOOL_ADDR)
      .addEventLog(HUBPOOL_MONITORED_EVENTS[3], TEST_HUBPOOL_ADDR, passedParams);

    const findings = await handleTransaction(txEvent);
    let thisFindingMetadata = getEventMetadataFromAbi(HUBPOOL_MONITORED_EVENTS[3], passedParams);
    expect(findings).toStrictEqual([getFindingInstance(thisFindingMetadata)]);
  });

  it("returns a finding for emitted monitored event from HubPool : Event IdentifierSet", async () => {
    const passedParams = [keccak256("hello world")];
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(TEST_HUBPOOL_ADDR)
      .addEventLog(HUBPOOL_MONITORED_EVENTS[4], TEST_HUBPOOL_ADDR, passedParams);

    const findings = await handleTransaction(txEvent);
    let thisFindingMetadata = getEventMetadataFromAbi(HUBPOOL_MONITORED_EVENTS[4], [passedParams[0].toString()]);
    expect(findings).toStrictEqual([getFindingInstance(thisFindingMetadata)]);
  });

  it("returns a finding for emitted monitored event from HubPool : Event CrossChainContractsSet", async () => {
    const passedParams = ["123", RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1]];
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(TEST_HUBPOOL_ADDR)
      .addEventLog(HUBPOOL_MONITORED_EVENTS[5], TEST_HUBPOOL_ADDR, passedParams);

    const findings = await handleTransaction(txEvent);
    let thisFindingMetadata = getEventMetadataFromAbi(HUBPOOL_MONITORED_EVENTS[5], passedParams);
    expect(findings).toStrictEqual([getFindingInstance(thisFindingMetadata)]);
  });

  it("returns a finding for emitted monitored event from HubPool : Event L1TokenEnabledForLiquidityProvision", async () => {
    const passedParams = [RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1]];
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(TEST_HUBPOOL_ADDR)
      .addEventLog(HUBPOOL_MONITORED_EVENTS[6], TEST_HUBPOOL_ADDR, passedParams);

    const findings = await handleTransaction(txEvent);
    let thisFindingMetadata = getEventMetadataFromAbi(HUBPOOL_MONITORED_EVENTS[6], passedParams);
    expect(findings).toStrictEqual([getFindingInstance(thisFindingMetadata)]);
  });

  it("returns a finding for emitted monitored event from HubPool : Event L2TokenDisabledForLiquidityProvision", async () => {
    const passedParams = [RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1]];
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(TEST_HUBPOOL_ADDR)
      .addEventLog(HUBPOOL_MONITORED_EVENTS[6], TEST_HUBPOOL_ADDR, passedParams);

    const findings = await handleTransaction(txEvent);
    let thisFindingMetadata = getEventMetadataFromAbi(HUBPOOL_MONITORED_EVENTS[6], passedParams);
    expect(findings).toStrictEqual([getFindingInstance(thisFindingMetadata)]);
  });

  it("returns a finding for emitted monitored event from HubPool : Event SetPoolRebalanceRoute", async () => {
    const passedParams = ["123", RANDOM_ADDRESSES[0], RANDOM_ADDRESSES[1]];
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(TEST_HUBPOOL_ADDR)
      .addEventLog(HUBPOOL_MONITORED_EVENTS[8], TEST_HUBPOOL_ADDR, passedParams);

    const findings = await handleTransaction(txEvent);
    let thisFindingMetadata = getEventMetadataFromAbi(HUBPOOL_MONITORED_EVENTS[8], passedParams);
    expect(findings).toStrictEqual([getFindingInstance(thisFindingMetadata)]);
  });

  it("returns a finding for emitted monitored event from HubPool : Event SetEnableDepositRoute", async () => {
    const passedParams = ["123", "456", RANDOM_ADDRESSES[1], true];
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(TEST_HUBPOOL_ADDR)
      .addEventLog(HUBPOOL_MONITORED_EVENTS[9], TEST_HUBPOOL_ADDR, passedParams);

    const findings = await handleTransaction(txEvent);
    let thisFindingMetadata = getEventMetadataFromAbi(HUBPOOL_MONITORED_EVENTS[9], passedParams);
    expect(findings).toStrictEqual([getFindingInstance(thisFindingMetadata)]);
  });

  it("returns a finding for emitted monitored event from HubPool : Event SetEnableDepositRoute", async () => {
    const passedParams = ["123", "0x12ab"];
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(TEST_HUBPOOL_ADDR)
      .addEventLog(HUBPOOL_MONITORED_EVENTS[10], TEST_HUBPOOL_ADDR, passedParams);

    const findings = await handleTransaction(txEvent);
    let thisFindingMetadata = getEventMetadataFromAbi(HUBPOOL_MONITORED_EVENTS[10], passedParams);
    expect(findings).toStrictEqual([getFindingInstance(thisFindingMetadata)]);
  });

  it("returns N findings for N events (N>=1)", async () => {
    const passedParams = ["123", "0x12ab"];

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(TEST_HUBPOOL_ADDR)
      .addEventLog(HUBPOOL_MONITORED_EVENTS[10], TEST_HUBPOOL_ADDR, passedParams)
      .addEventLog(HUBPOOL_MONITORED_EVENTS[0], TEST_HUBPOOL_ADDR, ["123"]);

    let thisFindingMetadataEvent1 = getEventMetadataFromAbi(HUBPOOL_MONITORED_EVENTS[10], passedParams);
    let thisFindingMetadataEvent2 = getEventMetadataFromAbi(HUBPOOL_MONITORED_EVENTS[0], ["123"]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      getFindingInstance(thisFindingMetadataEvent1),
      getFindingInstance(thisFindingMetadataEvent2),
    ]);
  });
});
