import { AgentConfig } from "./utils";
import { TestBlockEvent, MockEthersProvider, createAddress } from "forta-agent-tools/lib/tests";
import { ethers, Finding, FindingSeverity, FindingType, HandleBlock, Network } from "forta-agent";
import { provideHandleBlock } from "./agent";
import { FLASH_LOAN_FEE_PERCENTAGE_CHANGED_ABI, SWAP_FEE_PERCENTAGE_CHANGED_ABI } from "./constants";
import { NetworkManager } from "forta-agent-tools";

const createChecksumAddress = (address: string) => ethers.utils.getAddress(createAddress(address.toLowerCase()));

const PROTOCOL_FEES_COLLECTOR_ADDRESS = createChecksumAddress("0xfee5");

const DEFAULT_CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    protocolFeesCollectorAddress: PROTOCOL_FEES_COLLECTOR_ADDRESS,
  },
};

const PROTOCOL_FEES_COLLECTOR_IFACE = new ethers.utils.Interface([
  SWAP_FEE_PERCENTAGE_CHANGED_ABI,
  FLASH_LOAN_FEE_PERCENTAGE_CHANGED_ABI,
]);

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

  const getLog = (block: number, emitter: string, feeFrom: "FlashLoan" | "Swap", newFee: ethers.BigNumber) => {
    return {
      address: emitter,
      blockNumber: block,
      ...PROTOCOL_FEES_COLLECTOR_IFACE.encodeEventLog(
        PROTOCOL_FEES_COLLECTOR_IFACE.getEvent(`${feeFrom}FeePercentageChanged`),
        [newFee]
      ),
    } as ethers.providers.Log;
  };

  const getIrrelevantLog = (block: number, emitter: string) => {
    return {
      address: emitter,
      blockNumber: block,
      ...IRRELEVANT_IFACE.encodeEventLog(IRRELEVANT_IFACE.getEvent("IrrelevantEvent"), []),
    } as ethers.providers.Log;
  };

  beforeEach(() => {
    mockProvider = new MockEthersProvider();
    provider = mockProvider as unknown as ethers.providers.Provider;

    const networkManager = new NetworkManager(DEFAULT_CONFIG, Network.MAINNET);

    handleBlock = provideHandleBlock(provider, networkManager);
  });

  it("should return empty findings on an empty block", async () => {
    const blockEvent = new TestBlockEvent();

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
  });

  it("should ignore target events from other blocks", async () => {
    const blockEvent = new TestBlockEvent().setNumber(1);

    mockProvider.addLogs([
      getLog(0, PROTOCOL_FEES_COLLECTOR_ADDRESS, "Swap", ethers.BigNumber.from("1")),
      getLog(0, PROTOCOL_FEES_COLLECTOR_ADDRESS, "FlashLoan", ethers.BigNumber.from("1")),
    ]);

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
  });

  it("should ignore other events from the target address", async () => {
    const blockEvent = new TestBlockEvent().setNumber(0);

    mockProvider.addLogs([getIrrelevantLog(0, PROTOCOL_FEES_COLLECTOR_ADDRESS)]);

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
  });

  it("should ignore target events emitted from other addresses", async () => {
    const blockEvent = new TestBlockEvent().setNumber(0);

    const irrelevantAddress = createChecksumAddress("0x1");

    mockProvider.addLogs([
      getLog(0, irrelevantAddress, "Swap", ethers.BigNumber.from("1")),
      getLog(0, irrelevantAddress, "FlashLoan", ethers.BigNumber.from("1")),
    ]);

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
  });

  it("should generate a finding when a SwapFeePercentageChanged event is detected", async () => {
    const blockEvent = new TestBlockEvent().setNumber(0);

    mockProvider.addLogs([
      getLog(0, PROTOCOL_FEES_COLLECTOR_ADDRESS, "Swap", ethers.BigNumber.from("100000000000000")),
    ]);

    expect(await handleBlock(blockEvent)).toStrictEqual([createSwapFeeFinding("0.01")]);
  });

  it("should generate a finding when a FlashLoanFeePercentageChanged event is detected", async () => {
    const blockEvent = new TestBlockEvent().setNumber(0);

    mockProvider.addLogs([
      getLog(0, PROTOCOL_FEES_COLLECTOR_ADDRESS, "FlashLoan", ethers.BigNumber.from("1000000000000000")),
    ]);

    expect(await handleBlock(blockEvent)).toStrictEqual([createFlashLoanFeeFinding("0.1")]);
  });

  it("should return multiple findings for multiple events", async () => {
    const blockEvent = new TestBlockEvent().setNumber(0);

    mockProvider.addLogs([
      getLog(0, PROTOCOL_FEES_COLLECTOR_ADDRESS, "Swap", ethers.BigNumber.from("1000000000000000")),
      getLog(0, PROTOCOL_FEES_COLLECTOR_ADDRESS, "FlashLoan", ethers.BigNumber.from("1000000000000000")),
      getLog(0, PROTOCOL_FEES_COLLECTOR_ADDRESS, "Swap", ethers.BigNumber.from("20000000000000000")),
      getLog(0, PROTOCOL_FEES_COLLECTOR_ADDRESS, "FlashLoan", ethers.BigNumber.from("20000000000000000")),
      getLog(0, PROTOCOL_FEES_COLLECTOR_ADDRESS, "Swap", ethers.BigNumber.from("300000000000000000")),
      getLog(0, PROTOCOL_FEES_COLLECTOR_ADDRESS, "FlashLoan", ethers.BigNumber.from("300000000000000000")),
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
