import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";

import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { newPairParamsType } from "./utils";
import { createPairProvider } from "./agent";
import { APEFACTORY_ABI } from "./constants";
import { ethers } from "ethers";

const { CREATE_PAIR_FUNCTION } = APEFACTORY_ABI;

const MOCK_FUNCTION_ABI: string[] = [CREATE_PAIR_FUNCTION];

type mockConstantsType = {
  mockTokenA: string;
  mockTokenB: string;
  mockApeFactoryAddress: string;
  IMockApeFactory: ethers.utils.Interface;
};

const MOCK_CONSTANTS: mockConstantsType = {
  mockTokenA: createAddress("0xa1").toLowerCase(),
  mockTokenB: createAddress("0xb2").toLowerCase(),
  mockApeFactoryAddress: createAddress("0xaec1"),
  IMockApeFactory: new ethers.utils.Interface(MOCK_FUNCTION_ABI),
};

const mockCreateFinding = (functionAbi: string): Finding => {
  return Finding.fromObject({
    name: "new pair creation detection bot",
    description: `Detect the creation of new tradable pairs on Apeswap`,
    alertId: "APESWAP-8",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Apeswap",
    metadata: {
      tokenAAddress: mockTokenA,
      tokenBAddress: mockTokenB,
    },
  });
};

const { mockApeFactoryAddress, mockTokenA, mockTokenB, IMockApeFactory } = MOCK_CONSTANTS;

const mockProviderParams: newPairParamsType = {
  address: mockApeFactoryAddress,
  createFunctionSig: CREATE_PAIR_FUNCTION,
};

describe("New Pair Creation Test Suite", () => {
  let txEvent: TransactionEvent;
  const handleTransaction: HandleTransaction = createPairProvider(mockProviderParams);

  let findings: Finding[];

  it("should return empty finding if there are no new pair creation", async () => {
    txEvent = new TestTransactionEvent();
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return finding once new pair creation function is called", async () => {
    txEvent = new TestTransactionEvent().addTraces({
      to: mockApeFactoryAddress,
      input: IMockApeFactory.encodeFunctionData("createPair", [mockTokenA.toLowerCase(), mockTokenB.toLowerCase()]),
    });
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([mockCreateFinding(CREATE_PAIR_FUNCTION)]);
  });
});
