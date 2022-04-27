import { FindingType, FindingSeverity, Finding, HandleBlock, BlockEvent } from "forta-agent";
import { createAddress, TestBlockEvent, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import { provideHandleBlock } from "./agent";
import BalanceFetcher from "./balance.fetcher";
import { IMPLEMENTATION_IFACE } from "./utils";

const testProxyAddr: string = createAddress("0xab");
const testBlockNumbers: number[] = [2, 42, 92];
const testBorrowerDebtBalance: BigNumber[] = [
  BigNumber.from("5000000000000000000"), // 5
  BigNumber.from("10000000000000000000"), // 10
  BigNumber.from("15000000000000000000"), // 15
];
const testActiveBalanceCurrentEpoch: BigNumber[] = [
  BigNumber.from("2000000000000000000"), // 2
  BigNumber.from("12000000000000000000"), // 12
  BigNumber.from("15000000000000000000"), // 15
];

describe("high tether transfer agent", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const balanceFetcher: BalanceFetcher = new BalanceFetcher(mockProvider as any, testProxyAddr);
  const handleBlock: HandleBlock = provideHandleBlock(balanceFetcher);

  const createGetTotalBorrowerDebtBalance = (totalBorrowerDebtBalance: BigNumber, blockNumber: number) => {
    mockProvider.addCallTo(testProxyAddr, blockNumber, IMPLEMENTATION_IFACE, "getTotalBorrowerDebtBalance", {
      inputs: [],
      outputs: [totalBorrowerDebtBalance],
    });
  };

  const createGetTotalActiveBalanceCurrentEpoch = (totalActiveBalanceCurrentEpoch: BigNumber, blockNumber: number) => {
    mockProvider.addCallTo(testProxyAddr, blockNumber, IMPLEMENTATION_IFACE, "getTotalActiveBalanceCurrentEpoch", {
      inputs: [],
      outputs: [totalActiveBalanceCurrentEpoch],
    });
  };

  afterEach(() => {
    mockProvider.clear();
  });

  it("should detect a contract in an insolvent state", async () => {
    // testBorrowerDebtBalance[0] > testActiveBalanceCurrentEpoch[0]
    createGetTotalBorrowerDebtBalance(testBorrowerDebtBalance[0], testBlockNumbers[0]);
    createGetTotalActiveBalanceCurrentEpoch(testActiveBalanceCurrentEpoch[0], testBlockNumbers[0]);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlockNumbers[0]);

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Contract Insolvent",
        description: "Total borrower debt balance has exceeded total active balance current epoch",
        alertId: "DYDX-15",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "DYDX",
        metadata: {
          totalBorrowerDebtBalance: testBorrowerDebtBalance[0].toString(),
          totalActiveBalanceCurrentEpoch: testActiveBalanceCurrentEpoch[0].toString(),
        },
      }),
    ]);
  });

  it("should not return a finding if contract is not insolvent", async () => {
    // testBorrowerDebtBalance[1] < testActiveBalanceCurrentEpoch[1]
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
});
