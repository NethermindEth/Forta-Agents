import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";
import { BigNumber, utils } from "ethers";
import { when } from "jest-when";
import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests";
import { threshold } from "./utils";
import { provideTransactionHandler } from "./agent";
import { BANANA_CONSTANTS } from "./constants";
import { formatEther } from "@ethersproject/units";

const { BANANA_MINT_FUNCTION } = BANANA_CONSTANTS;
const MOCK_TRANSFER_FUNCTION: string = "function transfer(address recipient, uint256 amount) public returns (bool)";
const MOCK_FUNCTION_ABI: string[] = [BANANA_MINT_FUNCTION, MOCK_TRANSFER_FUNCTION];
const mockProviderParams: string = BANANA_MINT_FUNCTION;

type mockConstantsType = {
  MOCK_ACCOUNT_ONE: string;
  MOCK_ACCOUNT_TWO: string;
  MOCK_BANANA_ADDRESS: string;
  IBANANA_MINT_FUNCTION_ABI: utils.Interface;
};

const MOCK_CONSTANTS: mockConstantsType = {
  MOCK_ACCOUNT_ONE: createAddress("0xa1"),
  MOCK_ACCOUNT_TWO: createAddress("0xb2"),
  MOCK_BANANA_ADDRESS: createAddress("0xaabcde229"),
  IBANANA_MINT_FUNCTION_ABI: new utils.Interface(MOCK_FUNCTION_ABI),
};

const { IBANANA_MINT_FUNCTION_ABI } = MOCK_CONSTANTS;
const { MOCK_ACCOUNT_ONE, MOCK_ACCOUNT_TWO, MOCK_BANANA_ADDRESS } = MOCK_CONSTANTS;

const mockNetworkManager = {
  bananaAddress: MOCK_BANANA_ADDRESS,
};

const mockTotalSupplyFetcher = {
  getTotalSupply: jest.fn(),
};

export const mockCreateFinding = (from: string, to: string, value: string): Finding => {
  return Finding.fromObject({
    name: "detect banana mint",
    description: `${value} amount of banana mint detected`,
    alertId: "APESWAP-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Apeswap",

    metadata: {
      from: from,
      to: to || "",
      value: value,
    },
  });
};

const stringAmount1: string = "50000000000000000000000"; // threshold
const stringAmount2: string = "60000000000000000000000"; // above threshold
const stringAmount3: string = "70000000000000000000000"; // above threshold
const stringAmount4: string = "100000000000000000000000"; // mock total supply

describe("Large Banana Token Mints Test Suite", () => {
  let findings: Finding[];
  let txEvent: TransactionEvent;
  let handleTransaction: HandleTransaction;

  const testBalances: BigNumber[] = [
    BigNumber.from(stringAmount1), // threshold
    BigNumber.from(stringAmount2), // above threshold
    BigNumber.from(stringAmount3), // above threshold
    BigNumber.from(stringAmount4), // mock total supply
  ];

  const testBlocks: number[] = [341530, 341531, 341532];

  beforeEach(() => {
    handleTransaction = provideTransactionHandler(
      mockProviderParams,
      mockNetworkManager as any,
      mockTotalSupplyFetcher as any,
      threshold
    );
  });

  it("should return empty finding if no banana token is minted", async () => {
    txEvent = new TestTransactionEvent();
    findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should ignore other function calls on Banana Token Contract", async () => {
    txEvent = new TestTransactionEvent().addTraces({
      to: mockNetworkManager.bananaAddress,
      input: IBANANA_MINT_FUNCTION_ABI.encodeFunctionData("transfer", [MOCK_ACCOUNT_TWO, testBalances[1]]),
    });

    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore banana token mint call that is less than the specified mint amount", async () => {
    const mintAMount = BigNumber.from("10000000000000000000000"); // 10,000 - banana mint amount
    let specifiedAmount: any = mintAMount.div(threshold);
    txEvent = new TestTransactionEvent()
      .addTraces({
        to: mockNetworkManager.bananaAddress,
        input: IBANANA_MINT_FUNCTION_ABI.encodeFunctionData("mint", [specifiedAmount]),
      })
      .setTo(mockNetworkManager.bananaAddress)
      .setFrom(MOCK_ACCOUNT_ONE)
      .setBlock(testBlocks[1]);

    when(mockTotalSupplyFetcher.getTotalSupply)
      .calledWith(testBlocks[1] - 1)
      .mockReturnValue(testBalances[0]);

    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should detect BANANA token mints that correspond that to the configurable threshold", async () => {
    const mintAMount = BigNumber.from("100000000000000000000000"); // 100,000 - mock total supply
    txEvent = new TestTransactionEvent()
      .addTraces({
        to: mockNetworkManager.bananaAddress,
        input: IBANANA_MINT_FUNCTION_ABI.encodeFunctionData("mint", [mintAMount.div(threshold)]),
      })
      .setTo(mockNetworkManager.bananaAddress)
      .setFrom(MOCK_ACCOUNT_ONE)
      .setBlock(testBlocks[2]);

    when(mockTotalSupplyFetcher.getTotalSupply)
      .calledWith(testBlocks[2] - 1)
      .mockReturnValue(testBalances[0].div(threshold));

    findings = await handleTransaction(txEvent);
    const formattedValue = formatEther("50000000000000000000000");

    expect(findings).toStrictEqual([
      mockCreateFinding(MOCK_ACCOUNT_ONE, mockNetworkManager.bananaAddress, formattedValue),
    ]);
  });

  it("should return multiple findings for transactions with BANANA mints exceeding specified threshold", async () => {
    const formattedValue1 = formatEther(stringAmount1); // 50,000
    const formattedValue2 = formatEther(stringAmount2); // 60,000
    const formattedValue3 = formatEther(stringAmount3); // 70,000
    const formattedValue4 = formatEther(stringAmount4); // 100,000

    txEvent = new TestTransactionEvent()
      .addTraces(
        {
          to: mockNetworkManager.bananaAddress,
          input: IBANANA_MINT_FUNCTION_ABI.encodeFunctionData("mint", [testBalances[0]]),
        },
        {
          to: mockNetworkManager.bananaAddress,
          input: IBANANA_MINT_FUNCTION_ABI.encodeFunctionData("mint", [testBalances[1]]),
        },
        {
          to: mockNetworkManager.bananaAddress,
          input: IBANANA_MINT_FUNCTION_ABI.encodeFunctionData("mint", [testBalances[2]]),
        },
        {
          to: mockNetworkManager.bananaAddress,
          input: IBANANA_MINT_FUNCTION_ABI.encodeFunctionData("mint", [testBalances[3]]),
        }
      )
      .setTo(mockNetworkManager.bananaAddress)
      .setFrom(MOCK_ACCOUNT_ONE)
      .setBlock(testBlocks[2]);

    when(mockTotalSupplyFetcher.getTotalSupply)
      .calledWith(testBlocks[2] - 1)
      .mockReturnValue(testBalances[0]);
    when(mockTotalSupplyFetcher.getTotalSupply)
      .calledWith(testBlocks[2] - 1)
      .mockReturnValue(testBalances[1]);
    when(mockTotalSupplyFetcher.getTotalSupply)
      .calledWith(testBlocks[2] - 1)
      .mockReturnValue(testBalances[2]);
    when(mockTotalSupplyFetcher.getTotalSupply)
      .calledWith(testBlocks[2] - 1)
      .mockReturnValue(testBalances[3]);

    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      mockCreateFinding(MOCK_ACCOUNT_ONE, mockNetworkManager.bananaAddress, formattedValue1),
      mockCreateFinding(MOCK_ACCOUNT_ONE, mockNetworkManager.bananaAddress, formattedValue2),
      mockCreateFinding(MOCK_ACCOUNT_ONE, mockNetworkManager.bananaAddress, formattedValue3),
      mockCreateFinding(MOCK_ACCOUNT_ONE, mockNetworkManager.bananaAddress, formattedValue4),
    ]);
  });
});
