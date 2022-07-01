import { FindingType, FindingSeverity, Finding, HandleBlock, BlockEvent } from "forta-agent";
import { createAddress, TestBlockEvent, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import { provideHandleBlock } from "./agent";
import NetworkData from "./network";
import BalanceFetcher from "./balance.fetcher";
import { IMPLEMENTATION_IFACE } from "./utils";

const testBlockNumbers: number[] = [2, 42, 92, 360, 444, 445];
const testThreshold: BigNumber = BigNumber.from("3000000000000000000"); // 3
const testBorrowerDebtBalance: BigNumber[] = [
  BigNumber.from("5000000000000000000"), // 5
  BigNumber.from("10000000000000000000"), // 10
  BigNumber.from("15000000000000000000"), // 15
  BigNumber.from("20000000000000000000"), // 20
  BigNumber.from("25000000000000000000"), // 25
  BigNumber.from("30000000000000000000"), // 30
];
const testActiveBalanceCurrentEpoch: BigNumber[] = [
  BigNumber.from("1000000000000000000"), // 1
  BigNumber.from("9000000000000000000"), // 9
  BigNumber.from("15000000000000000000"), // 15
  BigNumber.from("22000000000000000000"), // 22
  BigNumber.from("21000000000000000000"), // 21
  BigNumber.from("26000000000000000000"), // 26
];

describe("Insolvent Contract test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockNetworkManager: NetworkData = {
    liquidityModule: createAddress("0xab"),
    networkMap: {},
    setNetwork: jest.fn(),
  };
  const balanceFetcher: BalanceFetcher = new BalanceFetcher(mockProvider as any, mockNetworkManager);

  const createGetTotalBorrowerDebtBalance = (totalBorrowerDebtBalance: BigNumber, blockNumber: number) => {
    mockProvider.addCallTo(
      mockNetworkManager.liquidityModule,
      blockNumber,
      IMPLEMENTATION_IFACE,
      "getTotalBorrowerDebtBalance",
      {
        inputs: [],
        outputs: [totalBorrowerDebtBalance],
      }
    );
  };

  const createGetTotalActiveBalanceCurrentEpoch = (totalActiveBalanceCurrentEpoch: BigNumber, blockNumber: number) => {
    mockProvider.addCallTo(
      mockNetworkManager.liquidityModule,
      blockNumber,
      IMPLEMENTATION_IFACE,
      "getTotalActiveBalanceCurrentEpoch",
      {
        inputs: [],
        outputs: [totalActiveBalanceCurrentEpoch],
      }
    );
  };

  const handleBlock: HandleBlock = provideHandleBlock(balanceFetcher, testThreshold);

  beforeEach(() => mockProvider.clear());

  it("should detect a contract in an insolvent state", async () => {
    // (testBorrowerDebtBalance[0] - testActiveBalanceCurrentEpoch[0]) > testThreshold
    createGetTotalBorrowerDebtBalance(testBorrowerDebtBalance[0], testBlockNumbers[0]);
    createGetTotalActiveBalanceCurrentEpoch(testActiveBalanceCurrentEpoch[0], testBlockNumbers[0]);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlockNumbers[0]);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Liquidity Module Contract is insolvent",
        description: "The total borrowed balance has exceeded total active balance in the current epoch",
        alertId: "DYDX-15",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          totalBorrowerDebtBalance: testBorrowerDebtBalance[0].toString(),
          totalActiveBalanceCurrentEpoch: testActiveBalanceCurrentEpoch[0].toString(),
        },
      }),
    ]);
  });

  it("should not return a finding if contract is not insolvent", async () => {
    // (testBorrowerDebtBalance[1] - testActiveBalanceCurrentEpoch[1]) < testThreshold
    createGetTotalBorrowerDebtBalance(testBorrowerDebtBalance[1], testBlockNumbers[1]);
    createGetTotalActiveBalanceCurrentEpoch(testActiveBalanceCurrentEpoch[1], testBlockNumbers[1]);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlockNumbers[1]);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should not return a finding if total borrower debt balance and total active balance current epoch are the same", async () => {
    // testBorrowerDebtBalance[2] === testActiveBalanceCurrentEpoch[2]
    createGetTotalBorrowerDebtBalance(testBorrowerDebtBalance[2], testBlockNumbers[2]);
    createGetTotalActiveBalanceCurrentEpoch(testActiveBalanceCurrentEpoch[2], testBlockNumbers[2]);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlockNumbers[2]);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should not return a finding if total borrower debt balance is less than total active balance current epoch", async () => {
    // testBorrowerDebtBalance[3] < testActiveBalanceCurrentEpoch[3]
    createGetTotalBorrowerDebtBalance(testBorrowerDebtBalance[3], testBlockNumbers[3]);
    createGetTotalActiveBalanceCurrentEpoch(testActiveBalanceCurrentEpoch[3], testBlockNumbers[3]);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlockNumbers[3]);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should detect a contract in an insolvent state in multiple blocks", async () => {
    // (testBorrowerDebtBalance[4] - testActiveBalanceCurrentEpoch[4]) > testThreshold
    createGetTotalBorrowerDebtBalance(testBorrowerDebtBalance[4], testBlockNumbers[4]);
    createGetTotalActiveBalanceCurrentEpoch(testActiveBalanceCurrentEpoch[4], testBlockNumbers[4]);

    const blockEventOne: BlockEvent = new TestBlockEvent().setNumber(testBlockNumbers[4]);

    const findingsOne = await handleBlock(blockEventOne);

    expect(findingsOne).toStrictEqual([
      Finding.fromObject({
        name: "Liquidity Module Contract is insolvent",
        description: "The total borrowed balance has exceeded total active balance in the current epoch",
        alertId: "DYDX-15",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          totalBorrowerDebtBalance: testBorrowerDebtBalance[4].toString(),
          totalActiveBalanceCurrentEpoch: testActiveBalanceCurrentEpoch[4].toString(),
        },
      }),
    ]);

    // (testBorrowerDebtBalance[5] - testActiveBalanceCurrentEpoch[5]) > testThreshold
    createGetTotalBorrowerDebtBalance(testBorrowerDebtBalance[5], testBlockNumbers[5]);
    createGetTotalActiveBalanceCurrentEpoch(testActiveBalanceCurrentEpoch[5], testBlockNumbers[5]);

    const blockEventTwo: BlockEvent = new TestBlockEvent().setNumber(testBlockNumbers[5]);

    const findingsTwo = await handleBlock(blockEventTwo);

    expect(findingsTwo).toStrictEqual([
      Finding.fromObject({
        name: "Liquidity Module Contract is insolvent",
        description: "The total borrowed balance has exceeded total active balance in the current epoch",
        alertId: "DYDX-15",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          totalBorrowerDebtBalance: testBorrowerDebtBalance[5].toString(),
          totalActiveBalanceCurrentEpoch: testActiveBalanceCurrentEpoch[5].toString(),
        },
      }),
    ]);
  });
});
