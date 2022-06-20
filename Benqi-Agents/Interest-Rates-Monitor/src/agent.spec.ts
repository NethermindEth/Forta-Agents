import { HandleBlock, Finding, FindingSeverity, FindingType } from "forta-agent";
import { provideHandleBlock } from "./agent";
import { createAddress, MockEthersProvider, TestBlockEvent } from "forta-agent-tools/lib/tests";
import { when } from "jest-when";
import { BigNumber } from "ethers";

const testCreateFinding = (address: string, rate: BigNumber, threshold: BigNumber, findingCase: string) => {
  switch (findingCase) {
    case "lowerSupply":
      return Finding.fromObject({
        name: "Supply rate below threshold drop",
        description: `A qiToken's supply interest rate dropped below lower threshold`,
        alertId: "BENQI-6-3",
        type: FindingType.Info,
        severity: FindingSeverity.Medium,
        protocol: "Benqi Finance",
        metadata: {
          tokenAddress: address.toLowerCase(),
          supplyInterestRate: rate.toString(),
          lowerRateThreshold: threshold.toString(),
        },
      });
    case "upperSupply":
      return Finding.fromObject({
        name: "Supply rate upper threshold excess",
        description: `A qiToken's supply interest rate exceeded upper threshold`,
        alertId: "BENQI-6-4",
        type: FindingType.Info,
        severity: FindingSeverity.Medium,
        protocol: "Benqi Finance",
        metadata: {
          tokenAddress: address.toLowerCase(),
          supplyInterestRate: rate.toString(),
          upperRateThreshold: threshold.toString(),
        },
      });
    case "lowerBorrow":
      return Finding.fromObject({
        name: "Βorrow rate below threshold drop",
        description: `A qiToken's borrow interest rate dropped below lower threshold`,
        alertId: "BENQI-6-1",
        type: FindingType.Info,
        severity: FindingSeverity.Medium,
        protocol: "Benqi Finance",
        metadata: {
          tokenAddress: address.toLowerCase(),
          borrowInterestRate: rate.toString(),
          lowerRateThreshold: threshold.toString(),
        },
      });
    default:
      return Finding.fromObject({
        name: "Borrow rate upper threshold excess",
        description: `A qiToken's borrow interest rate exceeded upper threshold`,
        alertId: "BENQI-6-2",
        type: FindingType.Info,
        severity: FindingSeverity.Medium,
        protocol: "Benqi Finance",
        metadata: {
          tokenAddress: address.toLowerCase(),
          borrowInterestRate: rate.toString(),
          upperRateThreshold: threshold.toString(),
        },
      });
  }
};

describe("Qi Tokens' interest rate thresholds excess bot test suite", () => {
  const mockGetSupplyInterestRates = jest.fn();
  const mockGetBorrowInterestRates = jest.fn();

  const mockProvider = new MockEthersProvider();
  const TEST_MARKETS = [
    createAddress("0x1111"),
    createAddress("0x2222"),
    createAddress("0x3333"),
    createAddress("0x4444"),
  ];

  const mockFetcher = {
    provider: mockProvider,
    markets: TEST_MARKETS,
    getSupplyInterestRates: mockGetSupplyInterestRates,
    getBorrowInterestRates: mockGetBorrowInterestRates,
  };

  const TEST_THRESHOLDS = {
    supply: [BigNumber.from(10), BigNumber.from(1000)],
    borrow: [BigNumber.from(20), BigNumber.from(1000)],
  };

  const handleBlock: HandleBlock = provideHandleBlock(TEST_THRESHOLDS, mockFetcher as any);

  beforeAll(() => {
    when(mockProvider.getLogs).mockReturnValue([]);
  });

  beforeEach(() => {
    mockFetcher.getSupplyInterestRates.mockClear();
    mockFetcher.getBorrowInterestRates.mockClear();
  });

  it("should return no findings if none of the thresholds have been exceeded", async () => {
    for (let i = 0; i < TEST_MARKETS.length; i++) {
      when(mockFetcher.getSupplyInterestRates).calledWith(55, TEST_MARKETS[i]).mockReturnValue(BigNumber.from(50));
      when(mockFetcher.getBorrowInterestRates).calledWith(55, TEST_MARKETS[i]).mockReturnValue(BigNumber.from(50));
    }
    const blockEvent = new TestBlockEvent().setNumber(55);
    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when a supply rate upper threshold has been exceeded", async () => {
    when(mockFetcher.getSupplyInterestRates).calledWith(100, TEST_MARKETS[0]).mockReturnValue(BigNumber.from(2000)); // exceeded threshold
    when(mockFetcher.getBorrowInterestRates).calledWith(100, TEST_MARKETS[0]).mockReturnValue(BigNumber.from(900));

    for (let i = 1; i < TEST_MARKETS.length; i++) {
      when(mockFetcher.getSupplyInterestRates).calledWith(100, TEST_MARKETS[i]).mockReturnValue(BigNumber.from(70));
      when(mockFetcher.getBorrowInterestRates).calledWith(100, TEST_MARKETS[i]).mockReturnValue(BigNumber.from(80));
    }

    const blockEvent = new TestBlockEvent().setNumber(100);
    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      testCreateFinding(TEST_MARKETS[0], BigNumber.from(2000), TEST_THRESHOLDS.supply[1], "upperSupply"),
    ]);
  });

  it("should return 2 findings when a token's supply and borrow rate upper thresholds have both been exceeded", async () => {
    when(mockFetcher.getSupplyInterestRates).calledWith(67, TEST_MARKETS[3]).mockReturnValue(BigNumber.from(2000)); // exceeded threshold
    when(mockFetcher.getBorrowInterestRates).calledWith(67, TEST_MARKETS[3]).mockReturnValue(BigNumber.from(1500)); // exceeded threshold

    for (let i = 0; i < 3; i++) {
      when(mockFetcher.getSupplyInterestRates).calledWith(67, TEST_MARKETS[i]).mockReturnValue(BigNumber.from(100));
      when(mockFetcher.getBorrowInterestRates).calledWith(67, TEST_MARKETS[i]).mockReturnValue(BigNumber.from(200));
    }

    const blockEvent = new TestBlockEvent().setNumber(67);
    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      testCreateFinding(TEST_MARKETS[3], BigNumber.from(2000), TEST_THRESHOLDS.supply[1], "upperSupply"),
      testCreateFinding(TEST_MARKETS[3], BigNumber.from(1500), TEST_THRESHOLDS.borrow[1], "upperBorrow"),
    ]);
  });

  it("should return 2 findings when a token's supply and borrow rate have both dropped below lower thresholds", async () => {
    when(mockFetcher.getSupplyInterestRates).calledWith(71, TEST_MARKETS[3]).mockReturnValue(BigNumber.from(5)); // dropped below threshold
    when(mockFetcher.getBorrowInterestRates).calledWith(71, TEST_MARKETS[3]).mockReturnValue(BigNumber.from(12)); // dropped below threshold

    for (let i = 0; i < 3; i++) {
      when(mockFetcher.getSupplyInterestRates).calledWith(71, TEST_MARKETS[i]).mockReturnValue(BigNumber.from(400));
      when(mockFetcher.getBorrowInterestRates).calledWith(71, TEST_MARKETS[i]).mockReturnValue(BigNumber.from(300));
    }

    const blockEvent = new TestBlockEvent().setNumber(71);
    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      testCreateFinding(TEST_MARKETS[3], BigNumber.from(5), TEST_THRESHOLDS.supply[0], "lowerSupply"),
      testCreateFinding(TEST_MARKETS[3], BigNumber.from(12), TEST_THRESHOLDS.borrow[0], "lowerBorrow"),
    ]);
  });

  it("should return 2 findings when a token's supply rate has dropped below lower threshold and borrow rate has exceeded upper threshold", async () => {
    when(mockFetcher.getSupplyInterestRates).calledWith(72, TEST_MARKETS[3]).mockReturnValue(BigNumber.from(5)); // dropped below threshold
    when(mockFetcher.getBorrowInterestRates).calledWith(72, TEST_MARKETS[3]).mockReturnValue(BigNumber.from(5000)); // exceeded threshold

    for (let i = 0; i < 3; i++) {
      when(mockFetcher.getSupplyInterestRates).calledWith(72, TEST_MARKETS[i]).mockReturnValue(BigNumber.from(200));
      when(mockFetcher.getBorrowInterestRates).calledWith(72, TEST_MARKETS[i]).mockReturnValue(BigNumber.from(400));
    }

    const blockEvent = new TestBlockEvent().setNumber(72);
    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      testCreateFinding(TEST_MARKETS[3], BigNumber.from(5), TEST_THRESHOLDS.supply[0], "lowerSupply"),
      testCreateFinding(TEST_MARKETS[3], BigNumber.from(5000), TEST_THRESHOLDS.borrow[1], "upperBorrow"),
    ]);
  });

  it("should return 2 findings when a token's borrow rate has dropped below lower threshold and supply rate has exceeded upper threshold", async () => {
    when(mockFetcher.getSupplyInterestRates).calledWith(73, TEST_MARKETS[3]).mockReturnValue(BigNumber.from(6000)); // exceeded threshold
    when(mockFetcher.getBorrowInterestRates).calledWith(73, TEST_MARKETS[3]).mockReturnValue(BigNumber.from(2)); // dropped below threshold

    for (let i = 0; i < 3; i++) {
      when(mockFetcher.getSupplyInterestRates).calledWith(73, TEST_MARKETS[i]).mockReturnValue(BigNumber.from(200));
      when(mockFetcher.getBorrowInterestRates).calledWith(73, TEST_MARKETS[i]).mockReturnValue(BigNumber.from(300));
    }

    const blockEvent = new TestBlockEvent().setNumber(73);
    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      testCreateFinding(TEST_MARKETS[3], BigNumber.from(6000), TEST_THRESHOLDS.supply[1], "upperSupply"),
      testCreateFinding(TEST_MARKETS[3], BigNumber.from(2), TEST_THRESHOLDS.borrow[0], "lowerBorrow"),
    ]);
  });

  it("should return 2 findings when one token's supply rate lower threshold and another's borrow rate upper threshold have been exceeded", async () => {
    when(mockFetcher.getSupplyInterestRates).calledWith(44, TEST_MARKETS[2]).mockReturnValue(BigNumber.from(2)); // dropped below threshold
    when(mockFetcher.getBorrowInterestRates).calledWith(44, TEST_MARKETS[2]).mockReturnValue(BigNumber.from(200));
    when(mockFetcher.getSupplyInterestRates).calledWith(44, TEST_MARKETS[3]).mockReturnValue(BigNumber.from(340));
    when(mockFetcher.getBorrowInterestRates).calledWith(44, TEST_MARKETS[3]).mockReturnValue(BigNumber.from(7000)); // exceeded threshold

    for (let i = 0; i < 2; i++) {
      when(mockFetcher.getSupplyInterestRates).calledWith(44, TEST_MARKETS[i]).mockReturnValue(BigNumber.from(400));
      when(mockFetcher.getBorrowInterestRates).calledWith(44, TEST_MARKETS[i]).mockReturnValue(BigNumber.from(600));
    }

    const blockEvent = new TestBlockEvent().setNumber(44);
    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      testCreateFinding(TEST_MARKETS[2], BigNumber.from(2), TEST_THRESHOLDS.supply[0], "lowerSupply"),
      testCreateFinding(TEST_MARKETS[3], BigNumber.from(7000), TEST_THRESHOLDS.borrow[1], "upperBorrow"),
    ]);
  });

  it("should return 4 findings when 4 thresholds have been exceeded", async () => {
    when(mockFetcher.getSupplyInterestRates).calledWith(505, TEST_MARKETS[0]).mockReturnValue(BigNumber.from(8000)); // exceeded threshold
    when(mockFetcher.getBorrowInterestRates).calledWith(505, TEST_MARKETS[0]).mockReturnValue(BigNumber.from(9000)); // exceeded threshold

    when(mockFetcher.getSupplyInterestRates).calledWith(505, TEST_MARKETS[1]).mockReturnValue(BigNumber.from(200));
    when(mockFetcher.getBorrowInterestRates).calledWith(505, TEST_MARKETS[1]).mockReturnValue(BigNumber.from(3)); // dropped below threshold

    when(mockFetcher.getSupplyInterestRates).calledWith(505, TEST_MARKETS[2]).mockReturnValue(BigNumber.from(300));
    when(mockFetcher.getBorrowInterestRates).calledWith(505, TEST_MARKETS[2]).mockReturnValue(BigNumber.from(400));

    when(mockFetcher.getSupplyInterestRates).calledWith(505, TEST_MARKETS[3]).mockReturnValue(BigNumber.from(4)); // dropped below threshold
    when(mockFetcher.getBorrowInterestRates).calledWith(505, TEST_MARKETS[3]).mockReturnValue(BigNumber.from(500));

    const blockEvent = new TestBlockEvent().setNumber(505);
    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      testCreateFinding(TEST_MARKETS[0], BigNumber.from(8000), TEST_THRESHOLDS.supply[1], "upperSupply"),
      testCreateFinding(TEST_MARKETS[3], BigNumber.from(4), TEST_THRESHOLDS.supply[0], "lowerSupply"),
      testCreateFinding(TEST_MARKETS[0], BigNumber.from(9000), TEST_THRESHOLDS.borrow[1], "upperBorrow"),
      testCreateFinding(TEST_MARKETS[1], BigNumber.from(3), TEST_THRESHOLDS.borrow[0], "lowerBorrow"),
    ]);
  });
});
