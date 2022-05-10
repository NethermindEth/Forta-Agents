import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";

import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { APEFACTORY_ABI } from "./constants";
import { ethers } from "ethers";

const { CREATE_PAIR_FUNCTION } = APEFACTORY_ABI;
const MOCK_SET_FEE_TO_SETTER_FUNCTION: string = "function setFeeToSetter(address _feeToSetter)";
const MOCK_FUNCTION_ABI: string[] = [CREATE_PAIR_FUNCTION, MOCK_SET_FEE_TO_SETTER_FUNCTION];

type mockConstantsType = {
  MOCK_TOKEN_A: string;
  MOCK_TOKEN_B: string;
  MOCK_TOKEN_C: string;
  MOCK_OTHER_CONTRACT_ADDRESS: string;
  MOCK_APE_FACTORY_ADDRESS: string;
  IMOCK_APEFACTORY_CREATE_PAIR_ABI: ethers.utils.Interface;
};

type mockNewPairParamsType = {
  functionSig: string;
  address: string;
};

const MOCK_CONSTANTS: mockConstantsType = {
  MOCK_TOKEN_A: createAddress("0xa1"),
  MOCK_TOKEN_B: createAddress("0xb2"),
  MOCK_TOKEN_C: createAddress("0xc3"),
  MOCK_APE_FACTORY_ADDRESS: createAddress("0xaec1"),
  MOCK_OTHER_CONTRACT_ADDRESS: createAddress("0xee5"),
  IMOCK_APEFACTORY_CREATE_PAIR_ABI: new ethers.utils.Interface(MOCK_FUNCTION_ABI),
};

const mockCreateFinding = (functionAbi: string): Finding => {
  return Finding.fromObject({
    name: "New pair creation on ApeFactory contract",
    description: `${functionAbi} call detected on ApeFactory contract upon creation of new tradable pairs`,
    alertId: "APESWAP-8",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Apeswap",
    metadata: {
      tokenAAddress: MOCK_TOKEN_A,
      tokenBAddress: MOCK_TOKEN_B,
    },
  });
};

const { MOCK_TOKEN_A, MOCK_TOKEN_B, MOCK_TOKEN_C, MOCK_APE_FACTORY_ADDRESS, IMOCK_APEFACTORY_CREATE_PAIR_ABI } =
  MOCK_CONSTANTS;

const mockProviderParams: mockNewPairParamsType = {
  functionSig: CREATE_PAIR_FUNCTION,
  address: MOCK_APE_FACTORY_ADDRESS,
};

describe("New Pair Creation Monitor Test Suite", () => {
  let txEvent: TransactionEvent;
  const handleTransaction: HandleTransaction = provideHandleTransaction(mockProviderParams);

  let findings: Finding[];

  it("should return empty finding if there are no new pair creation", async () => {
    txEvent = new TestTransactionEvent();
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore other function calls on ApeFactory contract", async () => {
    txEvent = new TestTransactionEvent().addTraces({
      to: MOCK_APE_FACTORY_ADDRESS,
      input: IMOCK_APEFACTORY_CREATE_PAIR_ABI.encodeFunctionData("setFeeToSetter", [MOCK_TOKEN_C]),
    });
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return finding once new pair creation function is called", async () => {
    txEvent = new TestTransactionEvent().addTraces({
      to: MOCK_APE_FACTORY_ADDRESS,
      input: IMOCK_APEFACTORY_CREATE_PAIR_ABI.encodeFunctionData("createPair", [MOCK_TOKEN_A, MOCK_TOKEN_B]),
    });
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([mockCreateFinding(CREATE_PAIR_FUNCTION)]);
  });
});
