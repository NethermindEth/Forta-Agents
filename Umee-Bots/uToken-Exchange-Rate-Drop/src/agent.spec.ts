import { HandleBlock, Initialize } from "forta-agent";
import { provideHandleBlock, provideInitialize } from "./agent";
import { createAddress, TestBlockEvent } from "forta-agent-tools/lib/tests.utils";
import { when, resetAllWhenMocks } from "jest-when";
import { createFinding, calculateSeverity } from "./utils";
import { BigNumber } from "ethers";
import CONFIG from "./agent.config";

const mockFetcher = {
  getUnderlyingAssetAddress: jest.fn(),
  getPrice: jest.fn(),
  getReserveNormalizedIncome: jest.fn(),
};

const uTokens = [
  { uToken: "uTOKEN1", address: createAddress("0xa1") },
  { uToken: "uTOKEN2", address: createAddress("0xa2") },
  { uToken: "uTOKEN3", address: createAddress("0xa3") },
];

const uTokenPairs = [
  { uToken1: "uTOKEN1", uToken2: "uTOKEN2", threshold: 0.1, difference: 0.05 }, // ratio of uTOKEN1 / uTOKEN2
  { uToken1: "uTOKEN2", uToken2: "uTOKEN3", threshold: 0.1, difference: 0.05 }, // ratio of uTOKEN2 / uTOKEN3
  { uToken1: "uTOKEN1", uToken2: "uTOKEN3", threshold: 0.1, difference: 0.05 }, // ratio of uTOKEN1 / uTOKEN3
];

const testUnderlyingAssetAddresses = [createAddress("0xua1"), createAddress("0xua2"), createAddress("0xua3")];

const testPrices: BigNumber[] = [
  BigNumber.from("1000000000000000000"),
  BigNumber.from("500000000000000"),
  BigNumber.from("625000000000000"),
  BigNumber.from("540000000000000"),
];

const testNormalizedIncomes: BigNumber[] = [
  BigNumber.from("1000000000000000000000000000"),
  BigNumber.from("1200000000000000000000000000"),
  BigNumber.from("1000100000000000000000000000"),
];

const calculatePriceRatio = (
  numeratorPrice: BigNumber,
  numeratorNormalizedIncome: BigNumber,
  denominatorPrice: BigNumber,
  denominatorNormalizedIncome: BigNumber
) => {
  return (
    Number(
      numeratorPrice
        .mul(numeratorNormalizedIncome)
        .mul(`${10 ** CONFIG.decimals}`)
        .div(denominatorPrice.mul(denominatorNormalizedIncome))
        .toString()
    ) /
    10 ** CONFIG.decimals
  );
};

describe("uToken Exchange Ratio Drop Test", () => {
  let handleBlock: HandleBlock;
  let initialize: Initialize;

  beforeEach(() => {
    mockFetcher.getPrice.mockClear();
    mockFetcher.getUnderlyingAssetAddress.mockClear();
    mockFetcher.getReserveNormalizedIncome.mockClear();

    resetAllWhenMocks();

    handleBlock = provideHandleBlock(mockFetcher as any, uTokenPairs);
  });

  it("should not return a finding if exchange ratio of a uToken pair is not dropped largely", async () => {
    /*
      previous ratio between uTOKEN1 and uTOKEN2 is 1
      current ratio between uTOKEN1 and uTOKEN2 is 0.926
      since it's below threshold, it shouldn't return a finding
    */
    when(mockFetcher.getUnderlyingAssetAddress)
      .calledWith(uTokens[0].address, 1)
      .mockReturnValue(testUnderlyingAssetAddresses[0])
      .calledWith(uTokens[1].address, 1)
      .mockReturnValue(testUnderlyingAssetAddresses[1])
      .calledWith(uTokens[2].address, 1)
      .mockReturnValue(testUnderlyingAssetAddresses[2])
      .calledWith(uTokens[0].address, "latest")
      .mockReturnValue(testUnderlyingAssetAddresses[0])
      .calledWith(uTokens[1].address, "latest")
      .mockReturnValue(testUnderlyingAssetAddresses[1])
      .calledWith(uTokens[2].address, "latest")
      .mockReturnValue(testUnderlyingAssetAddresses[2]);
    when(mockFetcher.getPrice)
      .calledWith(testUnderlyingAssetAddresses[0], 1)
      .mockReturnValue(testPrices[1])
      .calledWith(testUnderlyingAssetAddresses[1], 1)
      .mockReturnValue(testPrices[3])
      .calledWith(testUnderlyingAssetAddresses[2], 1)
      .mockReturnValue(testPrices[3])
      .calledWith(testUnderlyingAssetAddresses[0], "latest")
      .mockReturnValue(testPrices[1])
      .calledWith(testUnderlyingAssetAddresses[1], "latest")
      .mockReturnValue(testPrices[1])
      .calledWith(testUnderlyingAssetAddresses[2], "latest")
      .mockReturnValue(testPrices[2]);
    when(mockFetcher.getReserveNormalizedIncome)
      .calledWith(testUnderlyingAssetAddresses[0], 1)
      .mockReturnValue(testNormalizedIncomes[0])
      .calledWith(testUnderlyingAssetAddresses[1], 1)
      .mockReturnValue(testNormalizedIncomes[0])
      .calledWith(testUnderlyingAssetAddresses[2], 1)
      .mockReturnValue(testNormalizedIncomes[2])
      .calledWith(testUnderlyingAssetAddresses[0], "latest")
      .mockReturnValue(testNormalizedIncomes[0])
      .calledWith(testUnderlyingAssetAddresses[1], "latest")
      .mockReturnValue(testNormalizedIncomes[0])
      .calledWith(testUnderlyingAssetAddresses[2], "latest")
      .mockReturnValue(testNormalizedIncomes[2]);

    initialize = provideInitialize(mockFetcher as any, uTokens);

    await initialize();

    const blockEvent = new TestBlockEvent().setNumber(1);
    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if exchange ratio of a uToken pair is dropped largely", async () => {
    /*
      previous ratio between uTOKEN1 and uTOKEN2 is 1
      current ratio between uTOKEN1 and uTOKEN2 is 0.8
      since it's above threshold, it should return a finding
    */
    when(mockFetcher.getUnderlyingAssetAddress)
      .calledWith(uTokens[0].address, 1)
      .mockReturnValue(testUnderlyingAssetAddresses[0])
      .calledWith(uTokens[1].address, 1)
      .mockReturnValue(testUnderlyingAssetAddresses[1])
      .calledWith(uTokens[2].address, 1)
      .mockReturnValue(testUnderlyingAssetAddresses[2])
      .calledWith(uTokens[0].address, "latest")
      .mockReturnValue(testUnderlyingAssetAddresses[0])
      .calledWith(uTokens[1].address, "latest")
      .mockReturnValue(testUnderlyingAssetAddresses[1])
      .calledWith(uTokens[2].address, "latest")
      .mockReturnValue(testUnderlyingAssetAddresses[2]);
    when(mockFetcher.getPrice)
      .calledWith(testUnderlyingAssetAddresses[0], 1)
      .mockReturnValue(testPrices[1])
      .calledWith(testUnderlyingAssetAddresses[1], 1)
      .mockReturnValue(testPrices[2])
      .calledWith(testUnderlyingAssetAddresses[2], 1)
      .mockReturnValue(testPrices[2])
      .calledWith(testUnderlyingAssetAddresses[0], "latest")
      .mockReturnValue(testPrices[1])
      .calledWith(testUnderlyingAssetAddresses[1], "latest")
      .mockReturnValue(testPrices[1])
      .calledWith(testUnderlyingAssetAddresses[2], "latest")
      .mockReturnValue(testPrices[2]);
    when(mockFetcher.getReserveNormalizedIncome)
      .calledWith(testUnderlyingAssetAddresses[0], 1)
      .mockReturnValue(testNormalizedIncomes[0])
      .calledWith(testUnderlyingAssetAddresses[1], 1)
      .mockReturnValue(testNormalizedIncomes[0])
      .calledWith(testUnderlyingAssetAddresses[2], 1)
      .mockReturnValue(testNormalizedIncomes[2])
      .calledWith(testUnderlyingAssetAddresses[0], "latest")
      .mockReturnValue(testNormalizedIncomes[0])
      .calledWith(testUnderlyingAssetAddresses[1], "latest")
      .mockReturnValue(testNormalizedIncomes[0])
      .calledWith(testUnderlyingAssetAddresses[2], "latest")
      .mockReturnValue(testNormalizedIncomes[2]);

    initialize = provideInitialize(mockFetcher as any, uTokens);

    await initialize();

    const blockEvent = new TestBlockEvent().setNumber(1);
    const findings = await handleBlock(blockEvent);

    const previousRatio = calculatePriceRatio(
      testPrices[1],
      testNormalizedIncomes[0],
      testPrices[1],
      testNormalizedIncomes[0]
    );

    const currentRatio = calculatePriceRatio(
      testPrices[1],
      testNormalizedIncomes[0],
      testPrices[2],
      testNormalizedIncomes[0]
    );

    const severity = calculateSeverity(
      previousRatio - currentRatio - uTokenPairs[0].threshold,
      uTokenPairs[0].difference
    );

    expect(findings).toStrictEqual([
      createFinding(`${uTokens[0].uToken}/${uTokens[1].uToken}`, previousRatio, currentRatio, severity),
    ]);
  });

  it("should return multiple findings if exchange ratio of uToken pairs are dropped largely", async () => {
    /*
        previous ratio between uToken1 and uToken2 is 1, uTOKEN1 and uTOKEN3 is 0.79
        current ratio between uToken1 and uToken2 is 0.8, uTOKEN1 and uTOKEN3 is 0.66
        since both are above threshold, it should return two findings
      */
    when(mockFetcher.getUnderlyingAssetAddress)
      .calledWith(uTokens[0].address, 1)
      .mockReturnValue(testUnderlyingAssetAddresses[0])
      .calledWith(uTokens[1].address, 1)
      .mockReturnValue(testUnderlyingAssetAddresses[1])
      .calledWith(uTokens[2].address, 1)
      .mockReturnValue(testUnderlyingAssetAddresses[2])
      .calledWith(uTokens[0].address, "latest")
      .mockReturnValue(testUnderlyingAssetAddresses[0])
      .calledWith(uTokens[1].address, "latest")
      .mockReturnValue(testUnderlyingAssetAddresses[1])
      .calledWith(uTokens[2].address, "latest")
      .mockReturnValue(testUnderlyingAssetAddresses[2]);
    when(mockFetcher.getPrice)
      .calledWith(testUnderlyingAssetAddresses[0], 1)
      .mockReturnValue(testPrices[1])
      .calledWith(testUnderlyingAssetAddresses[1], 1)
      .mockReturnValue(testPrices[2]) // in current block, ratio between uToken1/uToken2 is 0.8
      .calledWith(testUnderlyingAssetAddresses[2], 1)
      .mockReturnValue(testPrices[2])
      .calledWith(testUnderlyingAssetAddresses[0], "latest")
      .mockReturnValue(testPrices[1])
      .calledWith(testUnderlyingAssetAddresses[1], "latest")
      .mockReturnValue(testPrices[1]) // in init, ratio between uToken1/uToken2 is 1
      .calledWith(testUnderlyingAssetAddresses[2], "latest")
      .mockReturnValue(testPrices[2]);
    when(mockFetcher.getReserveNormalizedIncome)
      .calledWith(testUnderlyingAssetAddresses[0], 1)
      .mockReturnValue(testNormalizedIncomes[0])
      .calledWith(testUnderlyingAssetAddresses[1], 1)
      .mockReturnValue(testNormalizedIncomes[0])
      .calledWith(testUnderlyingAssetAddresses[2], 1)
      .mockReturnValue(testNormalizedIncomes[1])
      .calledWith(testUnderlyingAssetAddresses[0], "latest")
      .mockReturnValue(testNormalizedIncomes[0])
      .calledWith(testUnderlyingAssetAddresses[1], "latest")
      .mockReturnValue(testNormalizedIncomes[0])
      .calledWith(testUnderlyingAssetAddresses[2], "latest")
      .mockReturnValue(testNormalizedIncomes[2]);

    initialize = provideInitialize(mockFetcher as any, uTokens);

    await initialize();

    const blockEvent = new TestBlockEvent().setNumber(1);
    const findings = await handleBlock(blockEvent);

    const previousRatio1 = calculatePriceRatio(
      testPrices[1],
      testNormalizedIncomes[0],
      testPrices[1],
      testNormalizedIncomes[0]
    );

    const currentRatio1 = calculatePriceRatio(
      testPrices[1],
      testNormalizedIncomes[0],
      testPrices[2],
      testNormalizedIncomes[0]
    );

    const previousRatio2 = calculatePriceRatio(
      testPrices[1],
      testNormalizedIncomes[0],
      testPrices[2],
      testNormalizedIncomes[2]
    );

    const currentRatio2 = calculatePriceRatio(
      testPrices[1],
      testNormalizedIncomes[0],
      testPrices[2],
      testNormalizedIncomes[1]
    );

    const severity1 = calculateSeverity(
      previousRatio1 - currentRatio1 - uTokenPairs[0].threshold,
      uTokenPairs[0].difference
    );

    const severity2 = calculateSeverity(
      previousRatio2 - currentRatio2 - uTokenPairs[2].threshold,
      uTokenPairs[2].difference
    );

    expect(findings).toStrictEqual([
      createFinding(`${uTokens[0].uToken}/${uTokens[1].uToken}`, previousRatio1, currentRatio1, severity1),
      createFinding(`${uTokens[0].uToken}/${uTokens[2].uToken}`, previousRatio2, currentRatio2, severity2),
    ]);
  });
});
