import { HandleBlock, Finding, FindingSeverity, FindingType } from "forta-agent";
import { provideHandleBlock } from "./agent";
import { createAddress, TestBlockEvent } from "forta-agent-tools/lib/tests";
import { when } from "jest-when";
import { BigNumber } from "ethers";

const testQiTokens: string[][] = [
  ["qiFGDF", createAddress("0x4444")],
  ["qiDFDS", createAddress("0x3333")],
  ["qiABCD", createAddress("0x2222")],
  ["qiDCBA", createAddress("0x1111")],
];

const testSupplyRateThresholds: BigNumber[][] = [
  [BigNumber.from(7000), BigNumber.from(12982000001)],
  [BigNumber.from(700), BigNumber.from(1212982000002)],
  [BigNumber.from(70), BigNumber.from(12121982000003)],
  [BigNumber.from(7), BigNumber.from(121212982000004)],
];

const testBorrowRateThresholds: BigNumber[][] = [
  [BigNumber.from(8), BigNumber.from(982000000001)],
  [BigNumber.from(80), BigNumber.from(98200000002)],
  [BigNumber.from(800), BigNumber.from(9820000003)],
  [BigNumber.from(8000), BigNumber.from(982000004)],
];

const testCreateFinding = (
  name: string,
  address: string,
  rate: BigNumber,
  threshold: BigNumber,
  findingCase: string
) => {
  switch (findingCase) {
    case "lowerBorrow":
      return Finding.fromObject({
        name: "Βorrow rate below threshold drop",
        description: `${name} token's borrow interest rate dropped below lower threshold`,
        alertId: "BENQI-6-1",
        type: FindingType.Suspicious,
        severity: FindingSeverity.Medium,
        protocol: "Benqi Finance",
        metadata: {
          token: name,
          tokenAddress: address.toLowerCase(),
          borrowInterestRate: rate.toString(),
          lowerRateThreshold: threshold.toString(),
          thresholdExceededBy: `${((rate.toNumber() - threshold.toNumber()) / threshold.toNumber())
            .toFixed(2)
            .toString()}%`,
        },
      });
    case "upperBorrow":
      return Finding.fromObject({
        name: "Borrow rate upper threshold excess",
        description: `${name} token's borrow interest rate exceeded upper threshold`,
        alertId: "BENQI-6-2",
        type: FindingType.Suspicious,
        severity: FindingSeverity.Medium,
        protocol: "Benqi Finance",
        metadata: {
          token: name,
          tokenAddress: address.toLowerCase(),
          borrowInterestRate: rate.toString(),
          upperRateThreshold: threshold.toString(),
          thresholdExceededBy: `${((rate.toNumber() - threshold.toNumber()) / threshold.toNumber())
            .toFixed(2)
            .toString()}%`,
        },
      });
    case "lowerSupply":
      return Finding.fromObject({
        name: "Supply rate below threshold drop",
        description: `${name} token's supply interest rate dropped below lower threshold`,
        alertId: "BENQI-6-3",
        type: FindingType.Suspicious,
        severity: FindingSeverity.Medium,
        protocol: "Benqi Finance",
        metadata: {
          token: name,
          tokenAddress: address.toLowerCase(),
          supplyInterestRate: rate.toString(),
          lowerRateThreshold: threshold.toString(),
          thresholdExceededBy: `${((rate.toNumber() - threshold.toNumber()) / threshold.toNumber())
            .toFixed(2)
            .toString()}%`,
        },
      });
    default:
      return Finding.fromObject({
        name: "Supply rate upper threshold excess",
        description: `${name} token's supply interest rate exceeded upper threshold`,
        alertId: "BENQI-6-4",
        type: FindingType.Suspicious,
        severity: FindingSeverity.Medium,
        protocol: "Benqi Finance",
        metadata: {
          token: name,
          tokenAddress: address.toLowerCase(),
          supplyInterestRate: rate.toString(),
          upperRateThreshold: threshold.toString(),
          thresholdExceededBy: `${((rate.toNumber() - threshold.toNumber()) / threshold.toNumber())
            .toFixed(2)
            .toString()}%`,
        },
      });
  }
};

describe("Qi Tokens' interest rate thresholds excess agent test suite", () => {
  const mockGetSupplyInterestRates = jest.fn();
  const mockGetBorrowInterestRates = jest.fn();
  const mockFetcher = {
    getSupplyInterestRates: mockGetSupplyInterestRates,
    getBorrowInterestRates: mockGetBorrowInterestRates,
  };

  const handleBlock: HandleBlock = provideHandleBlock(
    mockFetcher as any,
    testQiTokens,
    testBorrowRateThresholds,
    testSupplyRateThresholds
  );

  beforeEach(() => {
    mockFetcher.getSupplyInterestRates.mockClear();
    mockFetcher.getBorrowInterestRates.mockClear();
  });

  it("should return no findings if none of the thresholds have been exceeded", async () => {
    for (let i = 0; i < testQiTokens.length; i++) {
      when(mockFetcher.getSupplyInterestRates)
        .calledWith(55, testQiTokens[i][1])
        .mockReturnValue(BigNumber.from(231231).add(i));
      when(mockFetcher.getBorrowInterestRates)
        .calledWith(55, testQiTokens[i][1])
        .mockReturnValue(BigNumber.from(231231).sub(i));
    }
    const blockEvent = new TestBlockEvent().setNumber(55);
    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when a supply rate upper threshold has been exceeded", async () => {
    when(mockFetcher.getSupplyInterestRates)
      .calledWith(100, testQiTokens[0][1])
      .mockReturnValue(BigNumber.from(1982000000000)); // exceeded threshold
    when(mockFetcher.getBorrowInterestRates)
      .calledWith(100, testQiTokens[0][1])
      .mockReturnValue(BigNumber.from(231231));

    for (let i = 1; i < testQiTokens.length; i++) {
      when(mockFetcher.getSupplyInterestRates)
        .calledWith(100, testQiTokens[i][1])
        .mockReturnValue(BigNumber.from(231231).add(i));
      when(mockFetcher.getBorrowInterestRates)
        .calledWith(100, testQiTokens[i][1])
        .mockReturnValue(BigNumber.from(231231).sub(i));
    }

    const blockEvent = new TestBlockEvent().setNumber(100);
    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      testCreateFinding(
        testQiTokens[0][0],
        testQiTokens[0][1],
        BigNumber.from(1982000000000),
        testSupplyRateThresholds[0][1],
        "upperSupply"
      ),
    ]);
  });

  it("should return 2 findings when a token's supply and borrow rate upper thresholds have both been exceeded", async () => {
    when(mockFetcher.getSupplyInterestRates)
      .calledWith(67, testQiTokens[3][1])
      .mockReturnValue(BigNumber.from(321212982000000)); // exceeded threshold
    when(mockFetcher.getBorrowInterestRates)
      .calledWith(67, testQiTokens[3][1])
      .mockReturnValue(BigNumber.from(421212982000000)); // exceeded threshold

    for (let i = 0; i < 3; i++) {
      when(mockFetcher.getSupplyInterestRates)
        .calledWith(67, testQiTokens[i][1])
        .mockReturnValue(BigNumber.from(231231).add(i));
      when(mockFetcher.getBorrowInterestRates)
        .calledWith(67, testQiTokens[i][1])
        .mockReturnValue(BigNumber.from(231231).sub(i));
    }

    const blockEvent = new TestBlockEvent().setNumber(67);
    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      testCreateFinding(
        testQiTokens[3][0],
        testQiTokens[3][1],
        BigNumber.from(321212982000000),
        testSupplyRateThresholds[3][1],
        "upperSupply"
      ),
      testCreateFinding(
        testQiTokens[3][0],
        testQiTokens[3][1],
        BigNumber.from(421212982000000),
        testBorrowRateThresholds[3][1],
        "upperBorrow"
      ),
    ]);
  });

  it("should return 2 findings when a token's supply and borrow rate have both dropped below lower thresholds", async () => {
    when(mockFetcher.getSupplyInterestRates).calledWith(71, testQiTokens[3][1]).mockReturnValue(BigNumber.from(5)); // dropped below threshold
    when(mockFetcher.getBorrowInterestRates).calledWith(71, testQiTokens[3][1]).mockReturnValue(BigNumber.from(12)); // dropped below threshold

    for (let i = 0; i < 3; i++) {
      when(mockFetcher.getSupplyInterestRates)
        .calledWith(71, testQiTokens[i][1])
        .mockReturnValue(BigNumber.from(231231).add(i));
      when(mockFetcher.getBorrowInterestRates)
        .calledWith(71, testQiTokens[i][1])
        .mockReturnValue(BigNumber.from(231231).sub(i));
    }

    const blockEvent = new TestBlockEvent().setNumber(71);
    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      testCreateFinding(
        testQiTokens[3][0],
        testQiTokens[3][1],
        BigNumber.from(5),
        testSupplyRateThresholds[3][0],
        "lowerSupply"
      ),
      testCreateFinding(
        testQiTokens[3][0],
        testQiTokens[3][1],
        BigNumber.from(12),
        testBorrowRateThresholds[3][0],
        "lowerBorrow"
      ),
    ]);
  });

  it("should return 2 findings when a token's supply rate has dropped below lower threshold and borrow rate has exceeded upper threshold", async () => {
    when(mockFetcher.getSupplyInterestRates).calledWith(72, testQiTokens[3][1]).mockReturnValue(BigNumber.from(5)); // dropped below threshold
    when(mockFetcher.getBorrowInterestRates)
      .calledWith(72, testQiTokens[3][1])
      .mockReturnValue(BigNumber.from(421212982000001)); //e xceeded threshold

    for (let i = 0; i < 3; i++) {
      when(mockFetcher.getSupplyInterestRates)
        .calledWith(72, testQiTokens[i][1])
        .mockReturnValue(BigNumber.from(231231).add(i));
      when(mockFetcher.getBorrowInterestRates)
        .calledWith(72, testQiTokens[i][1])
        .mockReturnValue(BigNumber.from(231231).sub(i));
    }

    const blockEvent = new TestBlockEvent().setNumber(72);
    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      testCreateFinding(
        testQiTokens[3][0],
        testQiTokens[3][1],
        BigNumber.from(5),
        testSupplyRateThresholds[3][0],
        "lowerSupply"
      ),
      testCreateFinding(
        testQiTokens[3][0],
        testQiTokens[3][1],
        BigNumber.from(421212982000001),
        testBorrowRateThresholds[3][1],
        "upperBorrow"
      ),
    ]);
  });

  it("should return 2 findings when a token's borrow rate has dropped below lower threshold and supply rate has exceeded upper threshold", async () => {
    when(mockFetcher.getSupplyInterestRates)
      .calledWith(73, testQiTokens[3][1])
      .mockReturnValue(BigNumber.from(421212982000004)); // exceeded threshold
    when(mockFetcher.getBorrowInterestRates).calledWith(73, testQiTokens[3][1]).mockReturnValue(BigNumber.from(2)); // dropped below threshold

    for (let i = 0; i < 3; i++) {
      when(mockFetcher.getSupplyInterestRates)
        .calledWith(73, testQiTokens[i][1])
        .mockReturnValue(BigNumber.from(231231).add(i));
      when(mockFetcher.getBorrowInterestRates)
        .calledWith(73, testQiTokens[i][1])
        .mockReturnValue(BigNumber.from(231231).sub(i));
    }

    const blockEvent = new TestBlockEvent().setNumber(73);
    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      testCreateFinding(
        testQiTokens[3][0],
        testQiTokens[3][1],
        BigNumber.from(421212982000004),
        testSupplyRateThresholds[3][1],
        "upperSupply"
      ),
      testCreateFinding(
        testQiTokens[3][0],
        testQiTokens[3][1],
        BigNumber.from(2),
        testBorrowRateThresholds[3][0],
        "lowerBorrow"
      ),
    ]);
  });

  it("should return 2 findings when one token's supply rate lower threshold and another's borrow rate upper threshold have been exceeded", async () => {
    when(mockFetcher.getSupplyInterestRates).calledWith(44, testQiTokens[2][1]).mockReturnValue(BigNumber.from(2)); // dropped below threshold
    when(mockFetcher.getBorrowInterestRates).calledWith(44, testQiTokens[2][1]).mockReturnValue(BigNumber.from(2000));
    when(mockFetcher.getSupplyInterestRates).calledWith(44, testQiTokens[3][1]).mockReturnValue(BigNumber.from(3400));
    when(mockFetcher.getBorrowInterestRates)
      .calledWith(44, testQiTokens[3][1])
      .mockReturnValue(BigNumber.from(98200000023)); // exceeded threshold

    for (let i = 0; i < 2; i++) {
      when(mockFetcher.getSupplyInterestRates)
        .calledWith(44, testQiTokens[i][1])
        .mockReturnValue(BigNumber.from(231231).add(i));
      when(mockFetcher.getBorrowInterestRates)
        .calledWith(44, testQiTokens[i][1])
        .mockReturnValue(BigNumber.from(231231).sub(i));
    }

    const blockEvent = new TestBlockEvent().setNumber(44);
    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      testCreateFinding(
        testQiTokens[2][0],
        testQiTokens[2][1],
        BigNumber.from(2),
        testSupplyRateThresholds[2][0],
        "lowerSupply"
      ),
      testCreateFinding(
        testQiTokens[3][0],
        testQiTokens[3][1],
        BigNumber.from(98200000023),
        testBorrowRateThresholds[3][1],
        "upperBorrow"
      ),
    ]);
  });

  it("should return 4 findings when 4 thresholds have been exceeded", async () => {
    when(mockFetcher.getSupplyInterestRates)
      .calledWith(505, testQiTokens[0][1])
      .mockReturnValue(BigNumber.from(695695469456543)); // exceeded threshold
    when(mockFetcher.getBorrowInterestRates)
      .calledWith(505, testQiTokens[0][1])
      .mockReturnValue(BigNumber.from(795695469456543)); // exceeded threshold

    when(mockFetcher.getSupplyInterestRates)
      .calledWith(505, testQiTokens[1][1])
      .mockReturnValue(BigNumber.from(431231));
    when(mockFetcher.getBorrowInterestRates)
      .calledWith(505, testQiTokens[1][1])
      .mockReturnValue(BigNumber.from(3)); // dropped below threshold

    when(mockFetcher.getSupplyInterestRates)
      .calledWith(505, testQiTokens[2][1])
      .mockReturnValue(BigNumber.from(431235));
    when(mockFetcher.getBorrowInterestRates)
      .calledWith(505, testQiTokens[2][1])
      .mockReturnValue(BigNumber.from(331231));

    when(mockFetcher.getSupplyInterestRates)
      .calledWith(505, testQiTokens[3][1])
      .mockReturnValue(BigNumber.from(4)); // dropped below threshold
    when(mockFetcher.getBorrowInterestRates)
      .calledWith(505, testQiTokens[3][1])
      .mockReturnValue(BigNumber.from(431200));

    const blockEvent = new TestBlockEvent().setNumber(505);
    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      testCreateFinding(
        testQiTokens[0][0],
        testQiTokens[0][1],
        BigNumber.from(695695469456543),
        testSupplyRateThresholds[0][1],
        "upperSupply"
      ),
      testCreateFinding(
        testQiTokens[3][0],
        testQiTokens[3][1],
        BigNumber.from(4),
        testSupplyRateThresholds[3][0],
        "lowerSupply"
      ),
      testCreateFinding(
        testQiTokens[0][0],
        testQiTokens[0][1],
        BigNumber.from(795695469456543),
        testBorrowRateThresholds[0][1],
        "upperBorrow"
      ),
      testCreateFinding(
        testQiTokens[1][0],
        testQiTokens[1][1],
        BigNumber.from(3),
        testBorrowRateThresholds[1][0],
        "lowerBorrow"
      ),
    ]);
  });
});
