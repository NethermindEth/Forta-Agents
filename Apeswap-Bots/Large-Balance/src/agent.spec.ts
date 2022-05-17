import { Finding, HandleBlock, BlockEvent } from "forta-agent";
import { Interface } from "ethers/lib/utils";
import { provideHandleBlock } from "./agent";
import {
  createAddress,
  TestBlockEvent,
  MockEthersProvider,
} from "forta-agent-tools/lib/tests";
import { when } from "jest-when";
import { createLargeBalanceFinding, EVENT_ABI } from "./utils";
import { BigNumber, utils } from "ethers";

const TEST_GNANA_TOKEN_CONTRACT = createAddress("0xa1");
const TEST_GNANA_IFACE = new Interface(EVENT_ABI);
const IRRELEVANT_EVENT_IFACE = new Interface([
  "event IrrelevantEvent(address indexed from, address indexed to, uint256 amount)",
]);

const mockFetcher = {
  getBalance: jest.fn(),
  gnanaTokenAddress: TEST_GNANA_TOKEN_CONTRACT,
};

const testBalances: BigNumber[] = [
  BigNumber.from("300000000000000000000000000"), //above threshold
  BigNumber.from("80000000000000000000000000"), //above threshold
  BigNumber.from("30000"), //below threshold
];

const testBlock: number = 19214517;

const testAccounts: string[] = [
  createAddress("0x1"),
  createAddress("0x2"),
  createAddress("0x3"),
];

describe("Golden Banana(GNANA) Large Balance Tests", () => {
  let handleBlock: HandleBlock;
  const mockProvider = new MockEthersProvider();

  const balanceThreshold = BigNumber.from("3000000000")
    .mul(`${10 ** 18}`)
    .mul(1)
    .div(100);
  const testAddr: Set<string> = new Set<string>();

  beforeEach(() => {
    mockFetcher.getBalance.mockClear();
    mockProvider.clear();

    handleBlock = provideHandleBlock(
      mockFetcher as any,
      balanceThreshold,
      testAddr,
      mockProvider as any
    );
  });

  it("should return an empty finding if account balance is below threshold", async () => {
    const blockHash =
      "0x2d72d415ab86cadfb2222aa6e20c1eead908602f9469576b3cd848e5588a52fb";
    const filter = {
      address: "0x2449e7940b0df3426981945431aa9dc95b982702",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      ],
      blockHash:
        "0x2d72d415ab86cadfb2222aa6e20c1eead908602f9469576b3cd848e5588a52fb",
    };
    const logs = [
      {
        blockNumber: 19243883,
        blockHash:
          "0x2d72d415ab86cadfb2222aa6e20c1eead908602f9469576b3cd848e5588a52fb",
        transactionIndex: 4,
        removed: false,
        address: "0x2449E7940B0Df3426981945431AA9dc95b982702",
        data: "0x000000000000000000000000000000000000000000f330ebef7f58e6e6000000",
        topics: [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          "0x0000000000000000000000000db723d5863a9b33ad83aa349b27f8136b6d5360",
          "0x000000000000000000000000cffcb4c9d94524e4609ffef60c47daf8fc38ae1b",
        ],
        transactionHash:
          "0x0d1229486bb800cc835e60054466b1ef80df6167bd5414ac2ee340b3ad66fb40",
        logIndex: 8,
      },
    ];

    mockProvider.addFilteredLogs(filter, logs);

    when(mockFetcher.getBalance)
      .calledWith("0xCFfCb4c9d94524E4609FFEF60c47DAf8FC38AE1b", testBlock)
      .mockReturnValue(testBalances[2]);
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(testBlock)
      .setHash(blockHash);
    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if account balance is above threshold", async () => {
    const blockHash =
      "0x2d72d415ab86cadfb2222aa6e20c1eead908602f9469576b3cd848e5588a52fb";
    const filter = {
      address: "0x2449e7940b0df3426981945431aa9dc95b982702",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      ],
      blockHash:
        "0x2d72d415ab86cadfb2222aa6e20c1eead908602f9469576b3cd848e5588a52fb",
    };
    const logs = [
      {
        blockNumber: 19243883,
        blockHash:
          "0x2d72d415ab86cadfb2222aa6e20c1eead908602f9469576b3cd848e5588a52fb",
        transactionIndex: 4,
        removed: false,
        address: "0x2449E7940B0Df3426981945431AA9dc95b982702",
        data: "0x000000000000000000000000000000000000000000f330ebef7f58e6e6000000",
        topics: [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          "0x0000000000000000000000000db723d5863a9b33ad83aa349b27f8136b6d5360",
          "0x000000000000000000000000cffcb4c9d94524e4609ffef60c47daf8fc38ae1b",
        ],
        transactionHash:
          "0x0d1229486bb800cc835e60054466b1ef80df6167bd5414ac2ee340b3ad66fb40",
        logIndex: 8,
      },
    ];

    mockProvider.addFilteredLogs(filter, logs);

    when(mockFetcher.getBalance)
      .calledWith("0xCFfCb4c9d94524E4609FFEF60c47DAf8FC38AE1b", testBlock)
      .mockReturnValue(testBalances[0]);
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(testBlock)
      .setHash(blockHash);
    const findings: Finding[] = await handleBlock(blockEvent);
    console.log(findings);
    expect(findings).toStrictEqual([
      createLargeBalanceFinding(testAccounts[0], testBalances[0]),
    ]);
  });

  it("should return multiple findings if multiple accounts' balances are above threshold", async () => {
    const blockHash =
      "0x2d72d415ab86cadfb2222aa6e20c1eead908602f9469576b3cd848e5588a52fb";
    const filter = {
      address: "0x2449e7940b0df3426981945431aa9dc95b982702",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      ],
      blockHash:
        "0x2d72d415ab86cadfb2222aa6e20c1eead908602f9469576b3cd848e5588a52fb",
    };
    const logs = [
      {
        blockNumber: testBlock,
        blockHash:
          "0x2d72d415ab86cadfb2222aa6e20c1eead908602f9469576b3cd848e5588a52fb",
        transactionIndex: 4,
        removed: false,
        address: "0x2449E7940B0Df3426981945431AA9dc95b982702",
        data: "0x000000000000000000000000000000000000000000f330ebef7f58e6e6000000",
        topics: [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          "0x0000000000000000000000000db723d5863a9b33ad83aa349b27f8136b6d5360",
          "0x000000000000000000000000cffcb4c9d94524e4609ffef60c47daf8fc38ae1b",
        ],
        transactionHash:
          "0x0d1229486bb800cc835e60054466b1ef80df6167bd5414ac2ee340b3ad66fb40",
        logIndex: 8,
      },
    ];

    mockProvider.addFilteredLogs(filter, logs);
    when(mockFetcher.getBalance)
      .calledWith("0xcffcb4c9d94524e4609ffef60c47daf8fc38ae1b", testBlock)
      .mockReturnValue(testBalances[0]);
    when(mockFetcher.getBalance)
      .calledWith("0xcffcb4c9d94524e4609ffef60c47daf8fc38ae1b", testBlock)
      .mockReturnValue(testBalances[1]);

    const blockEvent: BlockEvent = new TestBlockEvent()
      .setNumber(testBlock)
      .setHash(blockHash);
    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      createLargeBalanceFinding(testAccounts[0], testBalances[0]),
      createLargeBalanceFinding(testAccounts[1], testBalances[1]),
    ]);
  });
});
