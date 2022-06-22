import { Finding, FindingType, FindingSeverity, TransactionEvent, HandleTransaction } from "forta-agent";

import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";

import { IF_ABI, provideHandleTransaction } from "./agent";

import { ethers, BigNumber } from "ethers";

const createFinding = (receiver: string, outAmount: string) =>
  Finding.fromObject({
    name: "IF token staxMigrate imbalanced mint",
    description: "staxMigrate was called and an unexpected amount of IF tokens have been minted",
    alertId: "IMPOSSIBLE-10",
    severity: FindingSeverity.High,
    type: FindingType.Exploit,
    protocol: "Impossible Finance",
    metadata: {
      receiver: receiver.toLowerCase(),
      ifAmountOut: outAmount,
    },
  });

// Function to easily generate log data for transfers
const generateTransferLog = (contract: ethers.utils.Interface, from: string, to: string, value: string) => {
  return contract.encodeEventLog(contract.getEvent("Transfer"), [
    createAddress(from),
    createAddress(to),
    BigNumber.from(value),
  ]);
};

describe("Impossible Finance staxMigrate imbalanced mint test suite", () => {
  let handler: HandleTransaction;
  let contract: ethers.utils.Interface;

  // Set the zero address
  const ZERO_ADDR = createAddress("0x0");
  // Set the IF token contract address
  const IF_ADDR = createAddress("0xa1");
  // Set the address of another token that is not IF
  const IRRELEVANT_ADDR = createAddress("0xb1");
  // Set a user address
  const USER_ADDR = createAddress("0xc1");

  // Setup to be run before the tests
  beforeAll(() => {
    // Setup the ethers interface
    contract = new ethers.utils.Interface(IF_ABI);
    // Get the agent handler
    handler = provideHandleTransaction(IF_ADDR);
  });

  it("should ignore empty transactions", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    // Run the handler on the test transaction
    const findings: Finding[] = await handler(tx);
    // Check if findings contain expected results
    expect(findings).toStrictEqual([]);
  });

  it("should ignore `staxMigrate` mints from other addresses", async () => {
    // Generate the event log
    const log = generateTransferLog(contract, ZERO_ADDR, USER_ADDR, BigNumber.from("100").toHexString());

    // Create the test transaction and attach the event log
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        to: IRRELEVANT_ADDR,
        from: USER_ADDR,
        input: contract.encodeFunctionData("staxMigrate", [BigNumber.from("101")]),
        output: "0x0",
      })
      .addAnonymousEventLog(IRRELEVANT_ADDR, log.data, ...log.topics);

    // Run the handler on the test transaction
    const findings: Finding[] = await handler(tx);

    // Check if findings contain expected results
    expect(findings).toStrictEqual([]);
  });

  it("should ignore `staxMigrate` mints that have the same input and output amount", async () => {
    // Generate the event log
    const log = generateTransferLog(contract, ZERO_ADDR, USER_ADDR, BigNumber.from("100").toHexString());

    // Create the test transaction and attach the event log
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        to: IF_ADDR,
        from: USER_ADDR,
        input: contract.encodeFunctionData("staxMigrate", [BigNumber.from("100")]),
        output: "0x0",
      })
      .addAnonymousEventLog(IF_ADDR, log.data, ...log.topics);

    // Run the handler on the test transaction
    const findings: Finding[] = await handler(tx);

    // Check if findings contain expected results
    expect(findings).toStrictEqual([]);
  });

  it("should ignore two `staxMigrate` mints that have the same input and output amount", async () => {
    // Generate the event log
    const log1 = generateTransferLog(contract, ZERO_ADDR, USER_ADDR, BigNumber.from("100").toHexString());
    const log2 = generateTransferLog(contract, ZERO_ADDR, USER_ADDR, BigNumber.from("200").toHexString());

    // Create the test transaction and attach the event log
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        to: IF_ADDR,
        from: USER_ADDR,
        input: contract.encodeFunctionData("staxMigrate", [BigNumber.from("100")]),
        output: "0x0",
      })
      .addTraces({
        to: IF_ADDR,
        from: USER_ADDR,
        input: contract.encodeFunctionData("staxMigrate", [BigNumber.from("200")]),
        output: "0x0",
      })
      .addAnonymousEventLog(IF_ADDR, log1.data, ...log1.topics)
      .addAnonymousEventLog(IF_ADDR, log2.data, ...log2.topics);

    // Run the handler on the test transaction
    const findings: Finding[] = await handler(tx);

    // Check if findings contain expected results
    expect(findings).toStrictEqual([]);
  });

  it("should detect `staxMigrate` mints that have a different input and output amount", async () => {
    // Generate the event log
    const log = generateTransferLog(contract, ZERO_ADDR, USER_ADDR, BigNumber.from("100").toHexString());

    // Create the test transaction and attach the event log
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        to: IF_ADDR,
        from: USER_ADDR,
        input: contract.encodeFunctionData("staxMigrate", [BigNumber.from("101")]),
        output: "0x0",
      })
      .addAnonymousEventLog(IF_ADDR, log.data, ...log.topics);

    // Run the handler on the test transaction
    const findings: Finding[] = await handler(tx);

    // Check if findings contain expected results
    expect(findings).toStrictEqual([createFinding(USER_ADDR, "100")]);
  });

  it("should detect two `staxMigrate` mints that have a different input and output amount", async () => {
    // Generate the event log
    const log1 = generateTransferLog(contract, ZERO_ADDR, USER_ADDR, BigNumber.from("100").toHexString());
    const log2 = generateTransferLog(contract, ZERO_ADDR, USER_ADDR, BigNumber.from("200").toHexString());

    // Create the test transaction and attach the event log
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        to: IF_ADDR,
        from: USER_ADDR,
        input: contract.encodeFunctionData("staxMigrate", [BigNumber.from("101")]),
        output: "0x0",
      })
      .addTraces({
        to: IF_ADDR,
        from: USER_ADDR,
        input: contract.encodeFunctionData("staxMigrate", [BigNumber.from("201")]),
        output: "0x0",
      })
      .addAnonymousEventLog(IF_ADDR, log1.data, ...log1.topics)
      .addAnonymousEventLog(IF_ADDR, log2.data, ...log2.topics);

    // Run the handler on the test transaction
    const findings: Finding[] = await handler(tx);

    // Check if findings contain expected results
    expect(findings).toStrictEqual([createFinding(USER_ADDR, "100"), createFinding(USER_ADDR, "200")]);
  });
});
