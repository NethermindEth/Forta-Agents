import {
  HandleTransaction,
} from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools";
import { provideHandleTransaction, createFinding } from "./agent";
import { stablePoolInterface } from "./abi";

const POOL_OWNER = createAddress("0x1");

describe("Unkill Agent Test Suite", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(POOL_OWNER);
  });

  it("should return empty findings because of non-relevant transactions", async () => {
    const txEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding unkill is called from the Curve Pool Owner", async () => {
    const poolAddress = createAddress("0x2");
    const txEvent = new TestTransactionEvent().addTraces({
      from: POOL_OWNER,
      to: poolAddress,
      input: stablePoolInterface.encodeFunctionData("unkill_me", []),
    });

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([createFinding({ to: poolAddress })]);
  });

  it("should return multiple findings if Curve Pool Owner call unkill_me multiple times", async () => {
    const poolAddress1 = createAddress("0x2");
    const poolAddress2 = createAddress("0x3");

    const txEvent = new TestTransactionEvent()
      .addTraces({
        from: POOL_OWNER,
        to: poolAddress1,
        input: stablePoolInterface.encodeFunctionData("unkill_me", []),
      })
      .addTraces({
        from: POOL_OWNER,
        to: poolAddress2,
        input: stablePoolInterface.encodeFunctionData("unkill_me", []),
      });

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding({ to: poolAddress1 }),
      createFinding({ to: poolAddress2 }),
    ]);
  });

  it("should ignore unkill_me calls if it is not from Curve Pool Owner", async () => {
    const poolAddress = createAddress("0x2");
    const txEvent = new TestTransactionEvent().addTraces({
      from: createAddress("0x0"),
      to: poolAddress,
      input: stablePoolInterface.encodeFunctionData("unkill_me", []),
    });

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should ignore if Curve Pool Owner does other kind of transaction", async () => {
    const poolAddress = createAddress("0x2");
    const txEvent = new TestTransactionEvent().addTraces({
      from: POOL_OWNER,
      to: poolAddress,
      input: "0x01231204032402213",
    });

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
