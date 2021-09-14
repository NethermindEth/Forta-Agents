import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { generalTestFindingGenerator, createAddress, TestTransactionEvent } from "./tests.utils";

import Web3 from "web3";
import provideERC20TransferAgent from "./erc20.transfers";

const TOKEN_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

const createTransactionEventWithTransferLog = (
  tokenAddress: string,
  from: string,
  to: string,
  amount: string
): TransactionEvent => {
  const web3: Web3 = new Web3();
  const fromTopic: string = web3.eth.abi.encodeParameter("address", from);
  const toTopic: string = web3.eth.abi.encodeParameter("address", to);
  const data: string = web3.eth.abi.encodeParameter("uint256", amount);
  return new TestTransactionEvent().addEventLog(
    "Transfer(address,address,uint256)",
    tokenAddress,
    [fromTopic, toTopic],
    data
  );
};

describe("ERC20 Transfer Agent Tests", () => {
  let handleTransaction: HandleTransaction;

  it("should returns empty findings if the expected event wasn't emitted", async () => {
    handleTransaction = provideERC20TransferAgent(generalTestFindingGenerator, TOKEN_ADDRESS);
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog("badSignature", TOKEN_ADDRESS);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should returns empty findings if the expected event wasn't emitted from the correct token", async () => {
    handleTransaction = provideERC20TransferAgent(generalTestFindingGenerator, TOKEN_ADDRESS);

    const txEvent: TransactionEvent = createTransactionEventWithTransferLog(
      "0x0",
      createAddress("0x0"),
      createAddress("0x0"),
      "0"
    );
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should returns a finding only if the expected event was emitted from the correct token", async () => {
    handleTransaction = provideERC20TransferAgent(generalTestFindingGenerator, TOKEN_ADDRESS);

    const txEvent: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x0"),
      createAddress("0x0"),
      "0"
    );
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent)]);
  });

  it("should returns a finding only if the event has in the field `to` the correct address", async () => {
    handleTransaction = provideERC20TransferAgent(generalTestFindingGenerator, TOKEN_ADDRESS, {
      to: createAddress("0x12"),
    });

    const txEvent1: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x0"),
      createAddress("0x0"),
      "0"
    );
    let findings: Finding[] = await handleTransaction(txEvent1);
    expect(findings).toStrictEqual([]);

    const txEvent2: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x0"),
      createAddress("0x12"),
      "0"
    );
    findings = findings.concat(await handleTransaction(txEvent2));
    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent2)]);
  });

  it("should returns a finding only if the event has in the field `from` the correct address", async () => {
    handleTransaction = provideERC20TransferAgent(generalTestFindingGenerator, TOKEN_ADDRESS, {
      from: createAddress("0x12"),
    });

    const txEvent1: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x0"),
      createAddress("0x0"),
      "0"
    );
    let findings: Finding[] = await handleTransaction(txEvent1);
    expect(findings).toStrictEqual([]);

    const txEvent2: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x12"),
      createAddress("0x0"),
      "0"
    );
    findings = findings.concat(await handleTransaction(txEvent2));
    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent2)]);
  });

  it("should returns a finding only if the event has in the field `value` a value greater than the specified threshold", async () => {
    handleTransaction = provideERC20TransferAgent(generalTestFindingGenerator, TOKEN_ADDRESS, {
      amountThreshold: "350",
    });

    const txEvent1: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x0"),
      createAddress("0x0"),
      "300"
    );
    let findings: Finding[] = await handleTransaction(txEvent1);
    expect(findings).toStrictEqual([]);

    const txEvent2: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x12"),
      createAddress("0x0"),
      "350"
    );
    findings = findings.concat(await handleTransaction(txEvent2));
    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent2)]);

    const txEvent3: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x12"),
      createAddress("0x0"),
      "360"
    );
    findings = findings.concat(await handleTransaction(txEvent2));
    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent2), generalTestFindingGenerator(txEvent3)]);
  });

  it("should returns a finding only if all the conditions are met", async () => {
    handleTransaction = provideERC20TransferAgent(generalTestFindingGenerator, TOKEN_ADDRESS, {
      from: createAddress("0x1"),
      to: createAddress("0x2"),
      amountThreshold: "350",
    });

    const txEvent1: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x1"),
      createAddress("0x2"),
      "300"
    );
    let findings: Finding[] = await handleTransaction(txEvent1);
    expect(findings).toStrictEqual([]);

    const txEvent2: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x1"),
      createAddress("0x0"),
      "350"
    );
    findings = findings.concat(await handleTransaction(txEvent2));
    expect(findings).toStrictEqual([]);

    const txEvent3: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x3"),
      createAddress("0x2"),
      "360"
    );
    findings = findings.concat(await handleTransaction(txEvent3));
    expect(findings).toStrictEqual([]);

    const txEvent4: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x1"),
      createAddress("0x2"),
      "360"
    );
    findings = findings.concat(await handleTransaction(txEvent4));
    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent4)]);
  });

  it("should pass correct metadata to findingGenerator", async () => {
    const findingGenerator = (metadata: { [key: string]: any } | undefined): Finding => {
      return Finding.fromObject({
        name: "testName",
        description: "testDescription",
        alertId: "testId",
        severity: FindingSeverity.Medium,
        type: FindingType.Suspicious,
        metadata: {
          from: metadata?.from,
          to: metadata?.to,
          amount: metadata?.amount,
        },
      });
    };
    handleTransaction = provideERC20TransferAgent(findingGenerator, TOKEN_ADDRESS);

    const txEvent: TransactionEvent = createTransactionEventWithTransferLog(
      TOKEN_ADDRESS,
      createAddress("0x1"),
      createAddress("0x2"),
      "300"
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      findingGenerator({ from: createAddress("0x1"), to: createAddress("0x2"), amount: "300" }),
    ]);
  });
});
