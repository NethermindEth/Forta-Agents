import { Finding, TransactionEvent, HandleTransaction } from "forta-agent";

import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests";

import { provideHandleTransaction } from "./agent";

import { createFinding } from "./finding";

// Address definitions to be used in testing
const AUGUSTUS_ADDR = createAddress("a1");
const EXTERNAL_ADDR_1 = createAddress("b1");
const EXTERNAL_ADDR_2 = createAddress("b2");

describe("Paraswap MultiPath DelegateCall Agent test suite", () => {
  let handler: HandleTransaction;

  beforeEach(() => {
    // Setup the handler
    handler = provideHandleTransaction(AUGUSTUS_ADDR);
  });

  it("ignores empty transactions", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();
    // Run the handler on the test transactions
    const findings: Finding[] = await handler(tx);
    // Check if findings contain expected results
    expect(findings).toStrictEqual([]);
  });

  it("ignores delegated calls to `megaSwap` and `multiSwap` from irrelevant contracts", async () => {
    // Create a transaction with delegated calls to `megaSwap` and `multiSwap` from an irrelevent address
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        to: EXTERNAL_ADDR_1,
        from: EXTERNAL_ADDR_2,
        // Manually place the function signature due to function argument complexity
        input: "0xa94e78ef",
        output: "0x0",
      })
      .addTraces({
        to: EXTERNAL_ADDR_1,
        from: EXTERNAL_ADDR_2,
        // Manually place the function signature due to function argument complexity
        input: "0x46c67b6d",
        output: "0x0",
      });

    // Set the call type of every trace to "delegatecall"
    tx.traces.forEach((trace) => {
      trace.action.callType = "delegatecall";
    });

    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([]);
  });

  it("ignores delegated calls to functions other than `megaSwap` and `multiSwap` from AugustusSwapper", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        to: EXTERNAL_ADDR_1,
        from: AUGUSTUS_ADDR,
        // Function signature that does not match `multiSwap` or `megaSwap`
        input: "0xa1b2c3d4",
        output: "0x0",
      });

    // Set the call type of every trace to "delegatecall"
    tx.traces.forEach((trace) => {
      trace.action.callType = "delegatecall";
    });

    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([]);
  });

  it("detects delegated calls to `megaSwap` and `multiSwap` from AugustusSwapper", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        to: EXTERNAL_ADDR_1,
        from: AUGUSTUS_ADDR,
        // Manually place the function signature due to function argument complexity
        input: "0xa94e78ef",
        output: "0x0",
      })
      .addTraces({
        to: EXTERNAL_ADDR_1,
        from: AUGUSTUS_ADDR,
        // Manually place the function signature due to function argument complexity
        input: "0x46c67b6d",
        output: "0x0",
      });

    // Set the call type of every trace to "delegatecall"
    tx.traces.forEach((trace) => {
      trace.action.callType = "delegatecall";
    });

    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([
      createFinding(EXTERNAL_ADDR_1, "0xa94e78ef"),
      createFinding(EXTERNAL_ADDR_1, "0x46c67b6d"),
    ]);
  });

  it("detects multiple delegated calls to `megaSwap` and `multiSwap` from AugustusSwapper", async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        to: EXTERNAL_ADDR_1,
        from: AUGUSTUS_ADDR,
        // Manually place the function signature due to function argument complexity
        input: "0xa94e78ef",
        output: "0x0",
      })
      .addTraces({
        to: EXTERNAL_ADDR_2,
        from: AUGUSTUS_ADDR,
        // Manually place the function signature due to function argument complexity
        input: "0x46c67b6d",
        output: "0x0",
      })
      .addTraces({
        to: EXTERNAL_ADDR_1,
        from: AUGUSTUS_ADDR,
        // Manually place the function signature due to function argument complexity
        input: "0xa94e78ef",
        output: "0x0",
      })
      .addTraces({
        to: EXTERNAL_ADDR_2,
        from: AUGUSTUS_ADDR,
        // Manually place the function signature due to function argument complexity
        input: "0x46c67b6d",
        output: "0x0",
      })

    // Set the call type of every trace to "delegatecall"
    tx.traces.forEach((trace) => {
      trace.action.callType = "delegatecall";
    });

    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([
      createFinding(EXTERNAL_ADDR_1, "0xa94e78ef"),
      createFinding(EXTERNAL_ADDR_2, "0x46c67b6d"),
      createFinding(EXTERNAL_ADDR_1, "0xa94e78ef"),
      createFinding(EXTERNAL_ADDR_2, "0x46c67b6d"),
    ]);
  });
});
