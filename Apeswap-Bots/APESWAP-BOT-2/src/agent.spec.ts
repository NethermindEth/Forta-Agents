import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { tokenType, includeAndExcludeFunctions, createFinding, provideBotHandler } from "./agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests.utils";
import { encodeFunctionCall } from "forta-agent-tools/lib/utils";
import { AbiItem } from "web3-utils";

type parameterDefinition = {
  name: string;
  type: string;
};
const createFunctionInterface = (functionName: string, ...functionParameters: parameterDefinition[]): AbiItem => ({
  type: "function",
  name: functionName,
  inputs: functionParameters.map(({ type, name }) => ({
    type,
    name,
  })),
});

const TOKEN_CONTRACT: tokenType = {
  address: createAddress("0x487GC"),
  name: "Test token",
};

describe("address inclusion and exclusion test", () => {
  const handleTransaction: HandleTransaction = provideBotHandler(TOKEN_CONTRACT, includeAndExcludeFunctions);

  it("should return empty findings if there are no inclusion/exclusion function calls", async () => {
    const transactionData = encodeFunctionCall(
      createFunctionInterface("transfer", { name: "value", type: "uint256" }, { name: "to", type: "address" }),
      ["100000000000000", createAddress("0x123")]
    );
    const txEvent: TransactionEvent = new TestTransactionEvent().setData(transactionData);
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it(`should return empty findings if there is an inclusion/exclusion function call not invoked from ${TOKEN_CONTRACT.name}`, async () => {
    let transactionData = encodeFunctionCall(
      createFunctionInterface("excludeAccount", { name: "account", type: "address" }),
      [createAddress("0x1237")]
    );
    let txEvent: TransactionEvent = new TestTransactionEvent().setData(transactionData).setTo(createAddress("0x568A"));
    let findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);

    transactionData = encodeFunctionCall(
      createFunctionInterface("includeAccount", { name: "account", type: "address" }),
      [createAddress("0x1389")]
    );
    txEvent = new TestTransactionEvent().setData(transactionData).setTo(createAddress("0x597A"));
    findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it(`should return a finding if there is an inclusion/exclusion function invocation from  ${TOKEN_CONTRACT.name}`, async () => {
    let transactionData = encodeFunctionCall(
      createFunctionInterface("excludeAccount", { name: "account", type: "address" }),
      [createAddress("0x1237")]
    );
    let txEvent: TransactionEvent = new TestTransactionEvent().setData(transactionData).setTo(TOKEN_CONTRACT.address);
    let findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([createFinding(createAddress("0x1237"), "excludeAccount", TOKEN_CONTRACT)]);

    transactionData = encodeFunctionCall(
      createFunctionInterface("includeAccount", { name: "account", type: "address" }),
      [createAddress("0x1389")]
    );
    txEvent = new TestTransactionEvent().setData(transactionData).setTo(TOKEN_CONTRACT.address);
    findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([createFinding(createAddress("0x1389"), "includeAccount", TOKEN_CONTRACT)]);
  });
});
