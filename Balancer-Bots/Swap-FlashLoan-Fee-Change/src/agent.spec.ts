import { AgentConfig, Network } from "./utils";
import { TestBlockEvent, MockEthersProvider, createAddress } from "forta-agent-tools/lib/tests";
import { ethers, Finding, FindingSeverity, FindingType, HandleBlock } from "forta-agent";
import { provideHandleBlock } from "./agent";
import { FLASH_LOAN_FEE_PERCENTAGE_CHANGED_ABI, SWAP_FEE_PERCENTAGE_CHANGED_ABI } from "./constants";
import NetworkManager from "./network";

const PROTOCOL_FEES_COLLECTOR_ADDRESS = createAddress("0xfee5");

const DEFAULT_CONFIG: AgentConfig = {
  [Network.ETHEREUM_MAINNET]: {
    protocolFeesCollectorAddress: PROTOCOL_FEES_COLLECTOR_ADDRESS,
  },
};

const VAULT_IFACE = new ethers.utils.Interface([
  SWAP_FEE_PERCENTAGE_CHANGED_ABI,
  FLASH_LOAN_FEE_PERCENTAGE_CHANGED_ABI,
]);

const TOPICS = [
  VAULT_IFACE.getEventTopic("FlashLoanFeePercentageChanged"),
  VAULT_IFACE.getEventTopic("SwapFeePercentageChanged"),
];

const IRRELEVANT_IFACE = new ethers.utils.Interface(["event IrrelevantEvent()"]);

export function createFlashLoanFeeFinding(newFee: string): Finding {
  return Finding.from({
    name: `FlashLoan fee changed`,
    description: `A FlashLoan fee percentage change was detected`,
    alertId: "BAL-1-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Balancer",
    metadata: {
      newFeePercentage: newFee,
    },
  });
}

export function createSwapFeeFinding(newFee: string): Finding {
  return Finding.from({
    name: `Swap fee changed`,
    description: `A Swap fee percentage change was detected`,
    alertId: "BAL-1-2",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Balancer",
    metadata: {
      newFeePercentage: newFee,
    },
  });
}

describe("Balancer Swap Fee & Flash Loan Fee Change Bot", () => {
  let handleBlock: HandleBlock;
  let provider: ethers.providers.Provider;
  let mockProvider: MockEthersProvider;

  const getLog = (feeFrom: "FlashLoan" | "Swap", newFee: ethers.BigNumber) => {
    return VAULT_IFACE.encodeEventLog(VAULT_IFACE.getEvent(`${feeFrom}FeePercentageChanged`), [
      newFee,
    ]) as ethers.providers.Log;
  };

  const setLogs = (block: number, emitter: string, topics: string[], logs: ethers.providers.Log[]) => {
    mockProvider.addFilteredLogs(
      {
        address: emitter,
        topics,
        fromBlock: block,
        toBlock: block,
      },
      logs
    );
  };

  beforeEach(() => {
    mockProvider = new MockEthersProvider();
    provider = mockProvider as unknown as ethers.providers.Provider;

    const networkManager = new NetworkManager(DEFAULT_CONFIG, provider, Network.ETHEREUM_MAINNET);

    handleBlock = provideHandleBlock(provider, networkManager);
  });

  it("should return empty findings on an empty block", async () => {
    const blockEvent = new TestBlockEvent();

    setLogs(0, PROTOCOL_FEES_COLLECTOR_ADDRESS, TOPICS, []);

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
  });

  it("should ignore target events from other blocks", async () => {
    const blockEvent = new TestBlockEvent().setNumber(1);

    setLogs(0, PROTOCOL_FEES_COLLECTOR_ADDRESS, TOPICS, [
      getLog("Swap", ethers.BigNumber.from("1")),
      getLog("FlashLoan", ethers.BigNumber.from("1")),
    ]);

    setLogs(1, PROTOCOL_FEES_COLLECTOR_ADDRESS, TOPICS, []);

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
  });

  it("should ignore other event topics from the target address", async () => {
    const blockEvent = new TestBlockEvent().setNumber(0);

    setLogs(0, PROTOCOL_FEES_COLLECTOR_ADDRESS, TOPICS, []);

    setLogs(
      0,
      PROTOCOL_FEES_COLLECTOR_ADDRESS,
      [...TOPICS, IRRELEVANT_IFACE.getEventTopic("IrrelevantEvent")],
      [
        getLog("Swap", ethers.BigNumber.from("1")),
        getLog("FlashLoan", ethers.BigNumber.from("1")),
        IRRELEVANT_IFACE.encodeEventLog(IRRELEVANT_IFACE.getEvent("IrrelevantEvent"), []) as ethers.providers.Log,
      ]
    );

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
  });

  it("should target events emitted from other addresses", async () => {
    const blockEvent = new TestBlockEvent().setNumber(0);

    const irrelevantAddress = createAddress("0x1");

    setLogs(0, PROTOCOL_FEES_COLLECTOR_ADDRESS, TOPICS, []);

    setLogs(0, irrelevantAddress, TOPICS, [
      getLog("Swap", ethers.BigNumber.from("1")),
      getLog("FlashLoan", ethers.BigNumber.from("1")),
    ]);

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
  });

  it("should generate a finding when a SwapFeePercentageChanged event is detected", async () => {
    const blockEvent = new TestBlockEvent().setNumber(0);

    setLogs(0, PROTOCOL_FEES_COLLECTOR_ADDRESS, TOPICS, [getLog("Swap", ethers.BigNumber.from("100000000000000"))]);

    expect(await handleBlock(blockEvent)).toStrictEqual([createSwapFeeFinding("0.01")]);
  });

  it("should generate a finding when a SwapFeePercentageChanged event is detected", async () => {
    const blockEvent = new TestBlockEvent().setNumber(0);

    setLogs(0, PROTOCOL_FEES_COLLECTOR_ADDRESS, TOPICS, [getLog("FlashLoan", ethers.BigNumber.from("1000000000000000"))]);

    expect(await handleBlock(blockEvent)).toStrictEqual([createFlashLoanFeeFinding("0.1")]);
  });

  it("should return multiple findings for multiple events", async () => {
    const blockEvent = new TestBlockEvent().setNumber(0);

    setLogs(0, PROTOCOL_FEES_COLLECTOR_ADDRESS, TOPICS, [
      getLog("Swap", ethers.BigNumber.from("1000000000000000")),
      getLog("FlashLoan", ethers.BigNumber.from("1000000000000000")),
      getLog("Swap", ethers.BigNumber.from("20000000000000000")),
      getLog("FlashLoan", ethers.BigNumber.from("20000000000000000")),
      getLog("Swap", ethers.BigNumber.from("300000000000000000")),
      getLog("FlashLoan", ethers.BigNumber.from("300000000000000000")),
    ]);

    expect(await handleBlock(blockEvent)).toStrictEqual([
      createSwapFeeFinding("0.1"),
      createFlashLoanFeeFinding("0.1"),
      createSwapFeeFinding("2.0"),
      createFlashLoanFeeFinding("2.0"),
      createSwapFeeFinding("30.0"),
      createFlashLoanFeeFinding("30.0"),
    ]);
  });
});
