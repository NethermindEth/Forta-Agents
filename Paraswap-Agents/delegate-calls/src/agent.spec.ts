import { Finding, FindingType, FindingSeverity, TransactionEvent, HandleTransaction } from "forta-agent";

import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests";

import { ethers } from "ethers";

import { provideHandleTransaction, PARA_ABI } from "./agent";

import { createFinding } from "./finding";

// Address definitions to be used in testing
const AUGUSTUS_ADDR = createAddress("a1");
const EXTERNAL_ADDR_1 = createAddress("b1");
const EXTERNAL_ADDR_2 = createAddress("b2");

describe("Paraswap Delegated Function Call Agent test suite", () => {
  let handler: HandleTransaction;
  let contract: ethers.utils.Interface;
  let mockCheckRouterRole: any;

  beforeEach(() => {
    // Setup the mock `checkRouterRole` function
    mockCheckRouterRole = jest.fn();
    // Setup the handler to use the mocked `checkRouterRole` function
    handler = provideHandleTransaction(AUGUSTUS_ADDR, mockCheckRouterRole);
    // Setup an ethers interface to be used when creating function calls in the test transactions
    contract = new ethers.utils.Interface(["function exampleFunctionCall(bool) returns (bool)"]);
  });

  it("ignores empty transactions", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();
    // Run the handler on the test transaction
    const findings: Finding[] = await handler(tx);
    // Check if findings contain expected results
    expect(findings).toStrictEqual([]);
  });

  it("ignores regular calls to other contracts", async () => {
    // Create a transaction with a regular call from a paraswap address to a external address
    const tx: TransactionEvent = new TestTransactionEvent().addTraces({
      to: EXTERNAL_ADDR_1,
      from: AUGUSTUS_ADDR,
      input: contract.encodeFunctionData("exampleFunctionCall", ["0x0"]),
      output: "0x0",
    });

    // Run the handler on the test transaction
    const findings: Finding[] = await handler(tx);
    // Check if findings contain expected results
    expect(findings).toStrictEqual([]);
  });

  it("ignores delegated calls from contracts not in the `addresses` array", async () => {
    // Create a transaction with a delegated call from a external address to a external address
    const tx: TransactionEvent = new TestTransactionEvent().addTraces({
      to: EXTERNAL_ADDR_1,
      from: EXTERNAL_ADDR_2,
      input: contract.encodeFunctionData("exampleFunctionCall", ["0x0"]),
      output: "0x0",
    });

    // Modify the trace to state that the call was type "delegatecall"
    tx.traces[0].action.callType = "delegatecall";

    // Run the handler on the test transaction
    const findings: Finding[] = await handler(tx);
    // Check if findings contain expected results
    expect(findings).toStrictEqual([]);
  });

  it("detects delegated calls from Paraswap contracts to contracts with `ROUTER_ROLE`", async () => {
    // Create a transaction with a delegated call from a paraswap address to a external address
    const tx: TransactionEvent = new TestTransactionEvent().addTraces({
      to: EXTERNAL_ADDR_1,
      from: AUGUSTUS_ADDR,
      input: contract.encodeFunctionData("exampleFunctionCall", ["0x0"]),
      output: "0x0",
    });

    // Set the mock function to state that `EXTERNAL_ADDR_1` has `ROUTER_ROLE`
    mockCheckRouterRole.mockResolvedValue(true);

    // Modify the trace to state that the call was type "delegatecall"
    tx.traces[0].action.callType = "delegatecall";

    // Run the handler on the test transaction
    const findings: Finding[] = await handler(tx);
    // Check if findings contain expected results
    expect(findings).toStrictEqual([createFinding(true, EXTERNAL_ADDR_1)]);
  });

  it("detects delegated calls from Paraswap contracts to contracts without `ROUTER_ROLE`", async () => {
    // Create a transaction with a delegated call from a paraswap address to an external address
    const tx: TransactionEvent = new TestTransactionEvent().addTraces({
      to: EXTERNAL_ADDR_1,
      from: AUGUSTUS_ADDR,
      input: contract.encodeFunctionData("exampleFunctionCall", ["0x0"]),
      output: "0x0",
    });

    // Set the mock function to state that `EXTERNAL_ADDR_1` doesn't have `ROUTER_ROLE`
    mockCheckRouterRole.mockResolvedValue(false);

    // Modify the trace to state that the call was type "delegatecall"
    tx.traces[0].action.callType = "delegatecall";

    // Run the handler on the test transaction
    const findings: Finding[] = await handler(tx);
    // Check if findings contain expected results
    expect(findings).toStrictEqual([createFinding(false, EXTERNAL_ADDR_1)]);
  });

  it("detects multiple delegated calls from Paraswap contracts to contracts with `ROUTER_ROLE`", async () => {
    // Create a transaction with two delegated calls from a paraswap address to two different external addresses
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        to: EXTERNAL_ADDR_1,
        from: AUGUSTUS_ADDR,
        input: contract.encodeFunctionData("exampleFunctionCall", ["0x0"]),
        output: "0x0",
      })
      .addTraces({
        to: EXTERNAL_ADDR_2,
        from: AUGUSTUS_ADDR,
        input: contract.encodeFunctionData("exampleFunctionCall", ["0x0"]),
        output: "0x0",
      });

    // Set the mock function to state that both external addresses have `ROUTER_ROLE`
    mockCheckRouterRole.mockResolvedValue(true);

    // Modify both traces to state that the call was type "delegatecall"
    tx.traces[0].action.callType = "delegatecall";
    tx.traces[1].action.callType = "delegatecall";

    // Run the handler on the test transaction
    const findings: Finding[] = await handler(tx);
    // Check if findings contain expected results
    expect(findings).toStrictEqual([createFinding(true, EXTERNAL_ADDR_1), createFinding(true, EXTERNAL_ADDR_2)]);
  });

  it("detects multiple delegated calls from Paraswap contracts to contracts without `ROUTER_ROLE`", async () => {
    // Create a transaction with two delegated calls from a paraswap address to two different external addresses
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        to: EXTERNAL_ADDR_1,
        from: AUGUSTUS_ADDR,
        input: contract.encodeFunctionData("exampleFunctionCall", ["0x0"]),
        output: "0x0",
      })
      .addTraces({
        to: EXTERNAL_ADDR_2,
        from: AUGUSTUS_ADDR,
        input: contract.encodeFunctionData("exampleFunctionCall", ["0x0"]),
        output: "0x0",
      });

    // Set the mock function to state that both external addresses don't have `ROUTER_ROLE`
    mockCheckRouterRole.mockResolvedValue(false);

    // Modify both traces to state that the call was type "delegatecall"
    tx.traces[0].action.callType = "delegatecall";
    tx.traces[1].action.callType = "delegatecall";

    // Run the handler on the test transaction
    const findings: Finding[] = await handler(tx);
    // Check if findings contain expected results
    expect(findings).toStrictEqual([createFinding(false, EXTERNAL_ADDR_1), createFinding(false, EXTERNAL_ADDR_2)]);
  });

  it("detects multiple delegated calls from Paraswap contracts to contracts with/without `ROUTER_ROLE`", async () => {
    // Create a transaction with two delegated calls from a paraswap address to two different external addresses
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        to: EXTERNAL_ADDR_1,
        from: AUGUSTUS_ADDR,
        input: contract.encodeFunctionData("exampleFunctionCall", ["0x0"]),
        output: "0x0",
      })
      .addTraces({
        to: EXTERNAL_ADDR_2,
        from: AUGUSTUS_ADDR,
        input: contract.encodeFunctionData("exampleFunctionCall", ["0x0"]),
        output: "0x0",
      });

    // Set the mock function to state that `EXTERNAL_ADDR_1` doesn't have `ROUTER_ROLE`
    mockCheckRouterRole.mockResolvedValueOnce(false);
    // Set the mock function to state that `EXTERNAL_ADDR_2` has `ROUTER_ROLE`
    mockCheckRouterRole.mockResolvedValueOnce(true);

    // Modify both traces to state that the call was type "delegatecall"
    tx.traces[0].action.callType = "delegatecall";
    tx.traces[1].action.callType = "delegatecall";

    // Run the handler on the test transaction
    const findings: Finding[] = await handler(tx);
    // Check if findings contain expected results
    expect(findings).toStrictEqual([createFinding(false, EXTERNAL_ADDR_1), createFinding(true, EXTERNAL_ADDR_2)]);
  });

  it("fallback finding is generated when the call to check if contract has `ROUTER_ROLE` fails", async () => {
    // Create a transaction with a delegated call from a paraswap address to an external address
    const tx: TransactionEvent = new TestTransactionEvent().addTraces({
      to: EXTERNAL_ADDR_1,
      // The `from` address is a Paraswap address
      from: AUGUSTUS_ADDR,
      input: contract.encodeFunctionData("exampleFunctionCall", ["0x0"]),
      output: "0x0",
    });

    // Set the mock function to reflect the call to on-chain data failed
    mockCheckRouterRole.mockResolvedValueOnce(undefined);

    // Modify the trace to state that the call was type "delegatecall"
    tx.traces[0].action.callType = "delegatecall";

    // Run the handler on the test transaction
    const findings: Finding[] = await handler(tx);
    // Check if findings contain expected results
    expect(findings).toStrictEqual([createFinding(undefined, EXTERNAL_ADDR_1)]);
  });
});
