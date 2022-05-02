import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { provideBotHandler } from "./agent";
import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests.utils";
import { encodeFunctionCall } from "forta-agent-tools/lib/utils";
import { AbiItem } from "web3-utils";

type parameterDefinition = {
  name: string;
  type: string;
};

type testTokenType = {
  address: string;
  name: string;
};

const testCreateFinding = (account: string, name: string, tokenInfo: testTokenType): Finding => {
  switch (name) {
    case "excludeAccount":
      return Finding.fromObject({
        name: "New Address exclusion",
        description: `${name} function call detected from ${tokenInfo.name} contract`,
        alertId: "APESWAP-2-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Apeswap",
        metadata: {
          "token Address": tokenInfo.address,
          "excluded Address": account,
        },
      });
    default:
      return Finding.fromObject({
        name: "New Address inclusion",
        description: `${name} function call detected from ${tokenInfo.name} contract`,
        alertId: "APESWAP-2-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Apeswap",
        metadata: {
          "token Address": tokenInfo.address,
          "included Address": account,
        },
      });
  }
};

const createFunctionInterface = (functionName: string, ...functionParameters: parameterDefinition[]): AbiItem => ({
  type: "function",
  name: functionName,
  inputs: functionParameters.map(({ type, name }) => ({
    type,
    name,
  })),
});

const createExclusionTransactionData = (addrToExcl: string): string =>
  encodeFunctionCall(createFunctionInterface("excludeAccount", { name: "account", type: "address" }), [addrToExcl]);

const createInclusionTransactionData = (addrToIncl: string): string =>
  encodeFunctionCall(createFunctionInterface("includeAccount", { name: "account", type: "address" }), [addrToIncl]);

const TOKEN_CONTRACT: testTokenType = {
  address: createAddress("0x487GC"),
  name: "Test token",
};

describe("address inclusion and exclusion bot test", () => {
  const handleTransaction: HandleTransaction = provideBotHandler(TOKEN_CONTRACT);
  const transferTransactionData = encodeFunctionCall(
    createFunctionInterface("transfer", { name: "value", type: "uint256" }, { name: "to", type: "address" }),
    ["100000000000000", createAddress("0x123")]
  );

  it("should return empty findings if there are no inclusion/exclusion function calls", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().setData(transferTransactionData);
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it(`should return empty findings if there is an inclusion/exclusion function call not invoked from ${TOKEN_CONTRACT.name}`, async () => {
    let txEvent: TransactionEvent = new TestTransactionEvent()
      .setData(createExclusionTransactionData(createAddress("0x1237")))
      .setTo(createAddress("0x568A"));
    let findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);

    txEvent = new TestTransactionEvent()
      .setData(createInclusionTransactionData(createAddress("0x1389")))
      .setTo(createAddress("0x597A"));
    findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it(`should return a finding if there is an inclusion/exclusion function invocation from  ${TOKEN_CONTRACT.name}`, async () => {
    let txEvent: TransactionEvent = new TestTransactionEvent()
      .setData(createExclusionTransactionData(createAddress("0x1237")))
      .setTo(TOKEN_CONTRACT.address);
    let findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([testCreateFinding(createAddress("0x1237"), "excludeAccount", TOKEN_CONTRACT)]);

    txEvent = new TestTransactionEvent()
      .setData(createInclusionTransactionData(createAddress("0x1389")))
      .setTo(TOKEN_CONTRACT.address);
    findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([testCreateFinding(createAddress("0x1389"), "includeAccount", TOKEN_CONTRACT)]);
  });

  it("should return multiple findings when there are multiple incl/excl internal txns", async () => {
    let txEvent: TransactionEvent = new TestTransactionEvent().addTraces(
      {
        input: createExclusionTransactionData(createAddress("0x345")),
        to: TOKEN_CONTRACT.address,
      },
      {
        input: createInclusionTransactionData(createAddress("0x943")),
        to: TOKEN_CONTRACT.address,
      },
      {
        input: createExclusionTransactionData(createAddress("0x987")),
        to: TOKEN_CONTRACT.address,
      }
    );
    let findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      testCreateFinding(createAddress("0x345"), "excludeAccount", TOKEN_CONTRACT),
      testCreateFinding(createAddress("0x943"), "includeAccount", TOKEN_CONTRACT),
      testCreateFinding(createAddress("0x987"), "excludeAccount", TOKEN_CONTRACT),
    ]);
  });

  it("should correctly return findings when there are multiple internal txns", async () => {
    let txEvent: TransactionEvent = new TestTransactionEvent().addTraces(
      {
        input: createExclusionTransactionData(createAddress("0x345")),
        to: TOKEN_CONTRACT.address,
      },
      {
        input: createInclusionTransactionData(createAddress("0x943")),
        to: createAddress("0x765"),
      },
      {
        input: createInclusionTransactionData(createAddress("0x987")),
        to: TOKEN_CONTRACT.address,
      },

      {
        input: transferTransactionData,
        to: TOKEN_CONTRACT.address,
      }
    );
    let findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      testCreateFinding(createAddress("0x345"), "excludeAccount", TOKEN_CONTRACT),
      testCreateFinding(createAddress("0x987"), "includeAccount", TOKEN_CONTRACT),
    ]);
  });
});
