import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { getCreate2Address } from "@ethersproject/address";
import { keccak256 } from "forta-agent/dist/sdk/utils";
import { provideHandleTransaction } from "./agent";
import { APEFACTORY_ABI } from "./constants";
import { ethers } from "ethers";
import NetworkData from "./network";

const { CREATE_PAIR_FUNCTION } = APEFACTORY_ABI;
const MOCK_SET_FEE_TO_SETTER_FUNCTION: string = "function setFeeToSetter(address _feeToSetter)";
const MOCK_FUNCTION_ABI: string[] = [CREATE_PAIR_FUNCTION, MOCK_SET_FEE_TO_SETTER_FUNCTION];

type mockConstantsType = {
  MOCK_TOKEN_A: string;
  MOCK_TOKEN_B: string;
  MOCK_TOKEN_C: string;
  MOCK_TOKEN_D: string;
  MOCK_TOKEN_E: string;
  MOCK_TOKEN_F: string;
  MOCK_TOKEN_G: string;
  MOCK_TOKEN_H: string;
  MOCK_APE_FACTORY_ADDRESS: string;
  MOCK_APE_INIT_CODE_HASH: string;
  IMOCK_APEFACTORY_CREATE_PAIR_ABI: ethers.utils.Interface;
};

type mockNewPairParamsType = {
  functionAbi: string;
};

const MOCK_CONSTANTS: mockConstantsType = {
  MOCK_TOKEN_A: createAddress("0xa1"),
  MOCK_TOKEN_B: createAddress("0xb2"),
  MOCK_TOKEN_C: createAddress("0xc3"),
  MOCK_TOKEN_D: createAddress("0xd4"),
  MOCK_TOKEN_E: createAddress("0xe5"),
  MOCK_TOKEN_F: createAddress("0xf6"),
  MOCK_TOKEN_G: createAddress("0xabcd7"),
  MOCK_TOKEN_H: createAddress("0xabcde8"),
  MOCK_APE_FACTORY_ADDRESS: createAddress("0xaec1"),
  MOCK_APE_INIT_CODE_HASH: keccak256("0xababa"),
  IMOCK_APEFACTORY_CREATE_PAIR_ABI: new ethers.utils.Interface(MOCK_FUNCTION_ABI),
};

const mockCreateFinding = (mockTokenA: string, mockTokenB: string, mockPair: string): Finding => {
  return Finding.fromObject({
    name: "New pair creation on ApeFactory contract",
    description: "New pair creation call detected on ApeFactory contract",
    alertId: "APESWAP-8",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Apeswap",
    metadata: {
      tokenAAddress: mockTokenA,
      tokenBAddress: mockTokenB,
      pairAddress: mockPair,
    },
  });
};

const {
  MOCK_TOKEN_A,
  MOCK_TOKEN_B,
  MOCK_TOKEN_C,
  MOCK_TOKEN_D,
  MOCK_TOKEN_E,
  MOCK_TOKEN_F,
  MOCK_TOKEN_G,
  MOCK_TOKEN_H,
  MOCK_APE_FACTORY_ADDRESS,
  MOCK_APE_INIT_CODE_HASH,
  IMOCK_APEFACTORY_CREATE_PAIR_ABI,
} = MOCK_CONSTANTS;

const mockNetworkManager: NetworkData = {
  apeFactoryAddress: MOCK_APE_FACTORY_ADDRESS,
  apeFactoryInitCodeHash: MOCK_APE_FACTORY_ADDRESS,
  setNetwork: jest.fn(),
};

const mockProviderParams: mockNewPairParamsType = {
  functionAbi: CREATE_PAIR_FUNCTION,
};

const mockApePairCreate2 = (token0: string, token1: string) => {
  const salt: string = keccak256(token0.concat(token1.slice(2)));
  return getCreate2Address(MOCK_APE_FACTORY_ADDRESS, salt, MOCK_APE_INIT_CODE_HASH).toLowerCase();
};

describe("New Pair Creation Monitor Test Suite", () => {
  let txEvent: TransactionEvent;
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(mockProviderParams, mockNetworkManager as any, mockApePairCreate2);
  });

  let findings: Finding[];

  it("should return empty finding if no new pair is created", async () => {
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

    const metadata = {
      tokenAAddress: MOCK_TOKEN_A,
      tokenBAddress: MOCK_TOKEN_B,
      pairAddress: mockApePairCreate2(MOCK_TOKEN_A, MOCK_TOKEN_B),
    };

    expect(findings).toStrictEqual([
      mockCreateFinding(metadata.tokenAAddress, metadata.tokenBAddress, metadata.pairAddress),
    ]);
  });

  it("should multiple findings once new pair creation function is called more than once", async () => {
    txEvent = new TestTransactionEvent().addTraces(
      {
        to: MOCK_APE_FACTORY_ADDRESS,
        input: IMOCK_APEFACTORY_CREATE_PAIR_ABI.encodeFunctionData("createPair", [MOCK_TOKEN_A, MOCK_TOKEN_B]),
      },
      {
        to: MOCK_APE_FACTORY_ADDRESS,
        input: IMOCK_APEFACTORY_CREATE_PAIR_ABI.encodeFunctionData("createPair", [MOCK_TOKEN_C, MOCK_TOKEN_D]),
      },
      {
        to: MOCK_APE_FACTORY_ADDRESS,
        input: IMOCK_APEFACTORY_CREATE_PAIR_ABI.encodeFunctionData("createPair", [MOCK_TOKEN_E, MOCK_TOKEN_F]),
      },
      {
        to: MOCK_APE_FACTORY_ADDRESS,
        input: IMOCK_APEFACTORY_CREATE_PAIR_ABI.encodeFunctionData("createPair", [MOCK_TOKEN_G, MOCK_TOKEN_H]),
      }
    );

    findings = await handleTransaction(txEvent);

    expect(findings.length).toStrictEqual(4);
    expect(findings).toStrictEqual([
      mockCreateFinding(MOCK_TOKEN_A, MOCK_TOKEN_B, mockApePairCreate2(MOCK_TOKEN_A, MOCK_TOKEN_B)),
      mockCreateFinding(MOCK_TOKEN_C, MOCK_TOKEN_D, mockApePairCreate2(MOCK_TOKEN_C, MOCK_TOKEN_D)),
      mockCreateFinding(MOCK_TOKEN_E, MOCK_TOKEN_F, mockApePairCreate2(MOCK_TOKEN_E, MOCK_TOKEN_F)),
      mockCreateFinding(MOCK_TOKEN_G, MOCK_TOKEN_H, mockApePairCreate2(MOCK_TOKEN_G, MOCK_TOKEN_H)),
    ]);
  });
});
