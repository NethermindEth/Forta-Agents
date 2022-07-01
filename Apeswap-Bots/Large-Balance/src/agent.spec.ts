import { Finding, HandleBlock, BlockEvent, keccak256 } from "forta-agent";
import { provideHandleBlock } from "./agent";
import { createAddress, TestBlockEvent, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { when } from "jest-when";
import { createLargeBalanceFinding } from "./utils";
import { BigNumber, utils } from "ethers";

const TEST_GNANA_TOKEN_CONTRACT = createAddress("0xa1");
const TRANSFER_EVENT_TOPIC: string = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const testBalances: BigNumber[] = [
  BigNumber.from("300000000000000000000000000"), //above threshold
  BigNumber.from("80000000000000000000000000"), //above threshold
  BigNumber.from("30000"), //below threshold
];
const testBlocks: number[] = [19214517, 3523543, 341532];
const testAccounts: string[] = [createAddress("0x1"), createAddress("0x2"), createAddress("0x3")];

describe("Golden Banana(GNANA) Large Balance Tests", () => {
  let handleBlock: HandleBlock;
  const mockProvider = new MockEthersProvider();

  const balanceThreshold = BigNumber.from("3000000000")
    .mul(`${10 ** 18}`)
    .mul(1)
    .div(100);
  const testAddr: Set<string> = new Set<string>();

  const mockNetworkManager = {
    gnana: TEST_GNANA_TOKEN_CONTRACT,
    setNetwork: jest.fn(),
  };
  const mockFetcher = {
    getBalance: jest.fn(),
  };

  beforeEach(() => {
    mockProvider.clear();
    handleBlock = provideHandleBlock(
      mockNetworkManager as any,
      mockFetcher as any,
      balanceThreshold,
      testAddr,
      mockProvider as any
    );
  });

  it("should return an empty finding if account balance is below threshold", async () => {
    const blockHash = keccak256("bHash0");
    const filter = {
      address: mockNetworkManager.gnana,
      topics: [TRANSFER_EVENT_TOPIC],
      blockHash: blockHash,
    };
    const logs = [
      {
        blockNumber: testBlocks[0],
        blockHash: blockHash,
        transactionIndex: 4,
        removed: false,
        address: mockNetworkManager.gnana,
        data: keccak256("dataData1"),
        topics: [
          TRANSFER_EVENT_TOPIC,
          utils.hexZeroPad(createAddress("0xbeef"), 32),
          utils.hexZeroPad(testAccounts[0], 32),
        ],
        transactionHash: keccak256("tHash1"),
        logIndex: 8,
      },
    ];

    mockProvider.addFilteredLogs(filter, logs);

    when(mockFetcher.getBalance).calledWith(testAccounts[0], testBlocks[0]).mockReturnValue(testBalances[2]);
    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlocks[0]).setHash(blockHash);
    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if account balance is above threshold", async () => {
    const blockHash = keccak256("bHash1");
    const filter = {
      address: mockNetworkManager.gnana,
      topics: [TRANSFER_EVENT_TOPIC],
      blockHash: blockHash,
    };
    const logs = [
      {
        blockNumber: testBlocks[1],
        blockHash: blockHash,
        transactionIndex: 4,
        removed: false,
        address: mockNetworkManager.gnana,
        data: keccak256("dataData2"),
        topics: [
          TRANSFER_EVENT_TOPIC,
          utils.hexZeroPad(createAddress("0xbeef"), 32),
          utils.hexZeroPad(testAccounts[1], 32),
        ],
        transactionHash: keccak256("tHash2"),
        logIndex: 8,
      },
    ];

    mockProvider.addFilteredLogs(filter, logs);

    when(mockFetcher.getBalance).calledWith(testAccounts[1], testBlocks[1]).mockReturnValue(testBalances[0]);
    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlocks[1]).setHash(blockHash);
    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([createLargeBalanceFinding(testAccounts[1], testBalances[0])]);
  });

  it("should return multiple findings if multiple accounts' balances are above threshold", async () => {
    const blockHash = keccak256("bHash2");
    const filter = {
      address: mockNetworkManager.gnana,
      topics: [TRANSFER_EVENT_TOPIC],
      blockHash: blockHash,
    };
    const logs = [
      {
        blockNumber: testBlocks[2],
        blockHash: blockHash,
        transactionIndex: 4,
        removed: false,
        address: mockNetworkManager.gnana,
        data: keccak256("dataData3"),
        topics: [
          TRANSFER_EVENT_TOPIC,
          utils.hexZeroPad(createAddress("0xaaaa"), 32),
          utils.hexZeroPad(testAccounts[1], 32),
        ],
        transactionHash: keccak256("tHash3"),
        logIndex: 8,
      },
      {
        blockNumber: testBlocks[2],
        blockHash: blockHash,
        transactionIndex: 4,
        removed: false,
        address: mockNetworkManager.gnana,
        data: keccak256("dataData4"),
        topics: [
          TRANSFER_EVENT_TOPIC,
          utils.hexZeroPad(createAddress("0xeeee"), 32),
          utils.hexZeroPad(testAccounts[2], 32),
        ],
        transactionHash: keccak256("tHash4"),
        logIndex: 8,
      },
    ];

    mockProvider.addFilteredLogs(filter, logs);
    when(mockFetcher.getBalance).calledWith(testAccounts[1], testBlocks[2]).mockReturnValue(testBalances[0]);
    when(mockFetcher.getBalance).calledWith(testAccounts[2], testBlocks[2]).mockReturnValue(testBalances[1]);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlocks[2]).setHash(blockHash);
    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      createLargeBalanceFinding(testAccounts[1], testBalances[0]),
      createLargeBalanceFinding(testAccounts[2], testBalances[1]),
    ]);
  });
});
