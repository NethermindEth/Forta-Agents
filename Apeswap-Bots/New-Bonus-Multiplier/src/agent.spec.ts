import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { provideBotHandler } from "./agent";
import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests.utils";
import { encodeFunctionCall } from "forta-agent-tools/lib/utils";
import { AbiItem } from "web3-utils";
import NetworkManager from "./network";

type parameterDefinition = {
  name: string;
  type: string;
};

const testCreateFinding = (testMultiplier: string, testContractAddress: string): Finding => {
  return Finding.fromObject({
    name: "Bonus Multiplier changed",
    description: "updateMultiplier function call detected from Apeswap's MasterApe contract",
    alertId: "APESWAP-11",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Apeswap",
    metadata: {
      MasterApe: testContractAddress,
      "New Bonus Multiplier": testMultiplier,
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

const createUpdateMultiplierTransactionData = (new_multiplier: string): string =>
  encodeFunctionCall(createFunctionInterface("updateMultiplier", { name: "multiplierNumber", type: "uint256" }), [
    new_multiplier,
  ]);

const TEST_MASTER_APE: string = createAddress("0x487GC");

describe("changes in the farm parameter BONUS_MULTIPLIER test suite", () => {
  const mockNetworkManager: NetworkManager = {
    masterApe: TEST_MASTER_APE,
    setNetwork: jest.fn(),
  };

  const handleTransaction: HandleTransaction = provideBotHandler(mockNetworkManager);
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
      .setData(createUpdateMultiplierTransactionData("3"))
      .setTo(createAddress("0x568A"));
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if there is an updateMultiplier function invocation from  Test contract", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setData(createUpdateMultiplierTransactionData("2"))
      .setTo(mockNetworkManager.masterApe);
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([testCreateFinding("2", mockNetworkManager.masterApe)]);
  });

  it("should return multiple findings when there are multiple updateMultiplier internal txns", async () => {
    let txEvent: TransactionEvent = new TestTransactionEvent().addTraces(
      {
        input: createUpdateMultiplierTransactionData("1"),
        to: createAddress("0x765"),
      },
      {
        input: createUpdateMultiplierTransactionData("5"),
        to: mockNetworkManager.masterApe,
      },
      {
        input: transferTransactionData,
        to: mockNetworkManager.masterApe,
      },
      {
        input: createUpdateMultiplierTransactionData("9"),
        to: mockNetworkManager.masterApe,
      }
    );
    let findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      testCreateFinding("5", mockNetworkManager.masterApe),
      testCreateFinding("9", mockNetworkManager.masterApe),
    ]);
  });
});
