import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { provideBotHandler } from "./agent";
import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests.utils";
import { encodeFunctionCall } from "forta-agent-tools/lib/utils";
import { AbiItem } from "web3-utils";

type parameterDefinition = {
  name: string;
  type: string;
};

type testContractType = {
  address: string;
  name: string;
};

const testCreateFinding = (multiplier: string, contractDetails: testContractType): Finding => {
  return Finding.fromObject({
    name: "Bonus Multiplier changed",
    description: `updateMultiplier function call detected from ${contractDetails.name} contract`,
    alertId: "APESWAP-11",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Apeswap",
    metadata: {
      "contract Address": contractDetails.address,
      "New Bonus Multiplier": multiplier,
    },
  });
};

const createFunctionInterface = (functionName: string, ...functionParameters: parameterDefinition[]): AbiItem => ({
  type: "function",
  name: functionName,
  inputs: functionParameters.map(({ type, name }) => ({
    type,
    name,
  })),
});

const createupdateMultiplierTransactionData = (new_multiplier: string): string =>
  encodeFunctionCall(createFunctionInterface("updateMultiplier", { name: "multiplierNumber", type: "uint256" }), [
    new_multiplier,
  ]);

const testContract: testContractType = {
  address: createAddress("0x487GC"),
  name: "Test contract",
};

describe("changes in the farm parameter BONUS_MULTIPLIER test suite", () => {
  const handleTransaction: HandleTransaction = provideBotHandler(testContract);
  const transferTransactionData = encodeFunctionCall(
    createFunctionInterface("transfer", { name: "value", type: "uint256" }, { name: "to", type: "address" }),
    ["100000000000000", createAddress("0x123")]
  );

  it("should return empty findings if there are no updateMultiplier function calls", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().setData(transferTransactionData);
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return empty findings if there is an updateMultiplier function call not invoked from Test Contract", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setData(createupdateMultiplierTransactionData("3"))
      .setTo(createAddress("0x568A"));
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if there is an updateMultiplier function invocation from  Test contract", async () => {
    let txEvent: TransactionEvent = new TestTransactionEvent()
      .setData(createupdateMultiplierTransactionData("2"))
      .setTo(testContract.address);
    let findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([testCreateFinding("2", testContract)]);
  });

  it("should return multiple findings when there are multiple incl/excl internal txns", async () => {
    let txEvent: TransactionEvent = new TestTransactionEvent().addTraces(
      {
        input: transferTransactionData,
        to: testContract.address,
      },
      {
        input: createupdateMultiplierTransactionData("1"),
        to: createAddress("0x765"),
      },
      {
        input: createupdateMultiplierTransactionData("5"),
        to: testContract.address,
      }
    );
    let findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([testCreateFinding("5", testContract)]);
  });
});
