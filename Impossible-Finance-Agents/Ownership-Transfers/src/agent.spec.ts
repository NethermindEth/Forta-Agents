import { FindingType, FindingSeverity, Finding, HandleTransaction } from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { encodeParameter } from "forta-agent-tools";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";

const testContracts = [createAddress("0x1"), createAddress("0x2"), createAddress("0x3")];

const createFinding = (contract: string, prev: string, newOwner: string) =>
  Finding.fromObject({
    name: "Ownership Transfers Detection ",
    description: "The ownership is trasferred.",
    alertId: "IMPOSSIBLE-3",
    severity: FindingSeverity.High,
    type: FindingType.Info,
    protocol: "Impossible Finance",
    metadata: {
      contract: contract,
      previousOwner: prev,
      newOwner: newOwner,
    },
  });

describe("Ownership Transfer Test Suite", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(testContracts);
  });

  it("should return no finding due to empty transaction", async () => {
    const tx = new TestTransactionEvent();

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([]);
  });

  it("should return empty finding due to wrong contract address", async () => {
    const tx = new TestTransactionEvent().addEventLog(
      "OwnershipTransferred(address,address)",
      createAddress("0x6"),
      "0x",
      encodeParameter("address", createAddress("0x4")),
      encodeParameter("address", createAddress("0x5"))
    );

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([]);
  });

  it("should return finding due to event emission", async () => {
    const tx = new TestTransactionEvent().addEventLog(
      "OwnershipTransferred(address,address)",
      testContracts[0],
      "0x",
      encodeParameter("address", createAddress("0x4")),
      encodeParameter("address", createAddress("0x5"))
    );

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([createFinding(testContracts[0], createAddress("0x4"), createAddress("0x5"))]);
  });

  it("should return finding for two ownership transfers event emissions", async () => {
    const tx = new TestTransactionEvent()
      .addEventLog(
        "OwnershipTransferred(address,address)",
        testContracts[1],
        "0x",
        encodeParameter("address", createAddress("0x4")),
        encodeParameter("address", createAddress("0x5"))
      )
      .addEventLog(
        "OwnershipTransferred(address,address)",
        testContracts[2],
        "0x",
        encodeParameter("address", createAddress("0x5")),
        encodeParameter("address", createAddress("0x6"))
      );

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([
      createFinding(testContracts[1], createAddress("0x4"), createAddress("0x5")),
      createFinding(testContracts[2], createAddress("0x5"), createAddress("0x6")),
    ]);
  });
});
