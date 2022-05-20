import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";
import { BigNumber, utils } from "ethers";
import { when } from "jest-when";
import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests";
import { threshold } from "./utils";
import { provideTransactionHandler } from "./agent";
import { BANANA_CONSTANTS } from "./constants";
const { BANANA_MINT_FUNCTION } = BANANA_CONSTANTS;

const MOCK_TRANSFER_FUNCTION: string =
  "function transfer(address recipient, uint256 amount) public returns (bool)";
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

describe("Large Banana Token Mints Test Suite", () => {
  let findings: Finding[];
  let txEvent: TransactionEvent;
  let handleTransaction: HandleTransaction;

  const testBalances: BigNumber[] = [
    BigNumber.from("100000000000000000000000"), // total supply
    BigNumber.from("49999999999999999999999"), // below threshold
  ];

  const testBlocks: number[] = [3523543, 341532];

  beforeAll(() => {
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

  it(`should ignore banana token mints that is less than half of the total supply`, async () => {
    const mintAMount = BigNumber.from("49999999999999999999999");
    txEvent = new TestTransactionEvent()
      .addTraces({
        to: mockNetworkManager.bananaAddress,
        input: IBANANA_MINT_FUNCTION_ABI.encodeFunctionData("mint", [mintAMount]),
      })
      .setTo(mockNetworkManager.bananaAddress)
      .setFrom(MOCK_ACCOUNT_ONE)
      .setBlock(testBlocks[0]);

    when(mockTotalSupplyFetcher.getTotalSupply).calledWith(testBlocks[0]).mockReturnValue(testBalances[0]);

    findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it(`should return findings only if banana mint amount is above half of total supply`, async () => {
    const mintAMount: BigNumber = BigNumber.from("100000000000000000000000");

    txEvent = new TestTransactionEvent()
      .addTraces({
        to: mockNetworkManager.bananaAddress,
        input: IBANANA_MINT_FUNCTION_ABI.encodeFunctionData("mint", [mintAMount]),
      })
      .setTo(mockNetworkManager.bananaAddress)
      .setFrom(MOCK_ACCOUNT_ONE)
      .setBlock(testBlocks[1]);

    when(mockTotalSupplyFetcher.getTotalSupply).calledWith(testBlocks[1]).mockReturnValue(testBalances[0]);

    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      mockCreateFinding(MOCK_ACCOUNT_ONE, mockNetworkManager.bananaAddress, mintAMount.toString()),
    ]);
  });
});
