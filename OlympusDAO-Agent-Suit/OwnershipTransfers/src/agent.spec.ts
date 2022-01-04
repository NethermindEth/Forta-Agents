import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent
} from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { 
  createAddress, 
  TestTransactionEvent, 
  encodeParameter 
} from "forta-agent-tools";

const pushFinding = (cur: string, prop: string): Finding => Finding.fromObject({
  name: "OlympusDAO Treasury Ownership event detected",
  description: "OwnershipPushed event",
  alertId: "olympus-treasury-4-1",
  severity: FindingSeverity.High,
  type: FindingType.Info,
  protocol: "OlympusDAO",
  metadata: {
    currentOwner: createAddress(cur),
    proposedOwner: createAddress(prop),
  }
});

const pullFinding = (prev: string, nnew: string): Finding => Finding.fromObject({
  name: "OlympusDAO Treasury Ownership event detected",
  description: "OwnershipPulled event",
  alertId: "olympus-treasury-4-2",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  protocol: "OlympusDAO",
  metadata: {
    previousOwner: createAddress(prev),
    newOwner: createAddress(nnew),
  }
});

describe("Ownership Transfers Test Suite", () => {
  const treasury: string = createAddress("0xdead");
  const handler: HandleTransaction = provideHandleTransaction(treasury);

  it("should ignore transactions not emitting events", async () => {
    const tx: TransactionEvent =  new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore transactions not emitting the correct event", async () => {
    const tx: TransactionEvent =  new TestTransactionEvent()
      .addEventLog(
        "MyEvent(address,address)",
        treasury,
        "0x",
        encodeParameter('address', createAddress("0xDA01")),
        encodeParameter('address', createAddress("0xDA02")),
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore transactions emitting the correct event in the wrong contract", async () => {
    const tx: TransactionEvent =  new TestTransactionEvent()
      .addEventLog(
        "OwnershipPushed(address,address)",
        createAddress("0xc0de"),
        "0x",
        encodeParameter('address', createAddress("0xDA01")),
        encodeParameter('address', createAddress("0xDA02")),
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect ownership transfer events", async () => {
    const tx: TransactionEvent =  new TestTransactionEvent()
      .addEventLog(
        "OwnershipPushed(address,address)",
        treasury,
        "0x",
        encodeParameter('address', createAddress("0xDA01")),
        encodeParameter('address', createAddress("0xDA02")),
      )
      .addEventLog(
        "OwnershipPulled(address,address)",
        treasury,
        "0x",
        encodeParameter('address', createAddress("0xDA03")),
        encodeParameter('address', createAddress("0xDA04")),
      )
      .addEventLog(
        "OwnershipPushed(address,address)",
        treasury,
        "0x",
        encodeParameter('address', createAddress("0xDA05")),
        encodeParameter('address', createAddress("0xDA06")),
      )
      .addEventLog(
        "OwnershipPushed(address,address)",
        treasury,
        "0x",
        encodeParameter('address', createAddress("0xDA07")),
        encodeParameter('address', createAddress("0xDA08")),
      )
      .addEventLog(
        "OwnershipPulled(address,address)",
        treasury,
        "0x",
        encodeParameter('address', createAddress("0xDA09")),
        encodeParameter('address', createAddress("0xDA00")),
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      pushFinding("0xda01", "0xda02"),
      pullFinding("0xda03", "0xda04"),
      pushFinding("0xda05", "0xda06"),
      pushFinding("0xda07", "0xda08"),
      pullFinding("0xda09", "0xda00"),
    ]);
  });
});
