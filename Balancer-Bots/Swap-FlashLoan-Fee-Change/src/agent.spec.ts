import { AgentConfig } from "./utils";
import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests";
import { ethers, Finding, FindingSeverity, FindingType, HandleTransaction, Network } from "forta-agent";
import { provideHandleTransaction } from "./agent";
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
    name: "FlashLoan fee changed on Balancer 'ProtocolFeesCollector' contract",
    description: `FlashLoan protocol fee percentage has changed to ${newFee}`,
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
    name: "Swap fee changed on Balancer 'ProtocolFeesCollector' contract",
    description: `Swap protocol fee percentage has changed to ${newFee}`,
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
  let handleTransaction: HandleTransaction;

  beforeEach(() => {
    const networkManager = new NetworkManager(DEFAULT_CONFIG, Network.MAINNET);

    handleTransaction = provideHandleTransaction(networkManager);
  });

  it("should return empty findings on an empty block", async () => {
    const txEvent = new TestTransactionEvent();

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should ignore other events from the target address", async () => {
    const txEvent = new TestTransactionEvent()
      .setBlock(0)
      .addInterfaceEventLog(IRRELEVANT_IFACE.getEvent("IrrelevantEvent"), PROTOCOL_FEES_COLLECTOR_ADDRESS, []);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should ignore target events emitted from other addresses", async () => {
    const irrelevantAddress = createChecksumAddress("0x1");
    const txEvent = new TestTransactionEvent()
      .setBlock(0)
      .addInterfaceEventLog(PROTOCOL_FEES_COLLECTOR_IFACE.getEvent("SwapFeePercentageChanged"), irrelevantAddress, [
        ethers.BigNumber.from("1"),
      ])
      .addInterfaceEventLog(
        PROTOCOL_FEES_COLLECTOR_IFACE.getEvent("FlashLoanFeePercentageChanged"),
        irrelevantAddress,
        [ethers.BigNumber.from("1")]
      );

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should generate a finding when a SwapFeePercentageChanged event is detected", async () => {
    const txEvent = new TestTransactionEvent()
      .setBlock(0)
      .addInterfaceEventLog(
        PROTOCOL_FEES_COLLECTOR_IFACE.getEvent("SwapFeePercentageChanged"),
        PROTOCOL_FEES_COLLECTOR_ADDRESS,
        [ethers.BigNumber.from("100000000000000")]
      );

    expect(await handleTransaction(txEvent)).toStrictEqual([createSwapFeeFinding("0.01")]);
  });

  it("should generate a finding when a FlashLoanFeePercentageChanged event is detected", async () => {
    const txEvent = new TestTransactionEvent()
      .setBlock(0)
      .addInterfaceEventLog(
        PROTOCOL_FEES_COLLECTOR_IFACE.getEvent("FlashLoanFeePercentageChanged"),
        PROTOCOL_FEES_COLLECTOR_ADDRESS,
        [ethers.BigNumber.from("1000000000000000")]
      );

    expect(await handleTransaction(txEvent)).toStrictEqual([createFlashLoanFeeFinding("0.1")]);
  });

  it("should return multiple findings for multiple events", async () => {
    const txEvent = new TestTransactionEvent()
      .setBlock(0)
      .addInterfaceEventLog(
        PROTOCOL_FEES_COLLECTOR_IFACE.getEvent("SwapFeePercentageChanged"),
        PROTOCOL_FEES_COLLECTOR_ADDRESS,
        [ethers.BigNumber.from("1000000000000000")]
      )
      .addInterfaceEventLog(
        PROTOCOL_FEES_COLLECTOR_IFACE.getEvent("FlashLoanFeePercentageChanged"),
        PROTOCOL_FEES_COLLECTOR_ADDRESS,
        [ethers.BigNumber.from("1000000000000000")]
      )
      .addInterfaceEventLog(
        PROTOCOL_FEES_COLLECTOR_IFACE.getEvent("SwapFeePercentageChanged"),
        PROTOCOL_FEES_COLLECTOR_ADDRESS,
        [ethers.BigNumber.from("20000000000000000")]
      )
      .addInterfaceEventLog(
        PROTOCOL_FEES_COLLECTOR_IFACE.getEvent("FlashLoanFeePercentageChanged"),
        PROTOCOL_FEES_COLLECTOR_ADDRESS,
        [ethers.BigNumber.from("20000000000000000")]
      )
      .addInterfaceEventLog(
        PROTOCOL_FEES_COLLECTOR_IFACE.getEvent("SwapFeePercentageChanged"),
        PROTOCOL_FEES_COLLECTOR_ADDRESS,
        [ethers.BigNumber.from("300000000000000000")]
      )
      .addInterfaceEventLog(
        PROTOCOL_FEES_COLLECTOR_IFACE.getEvent("FlashLoanFeePercentageChanged"),
        PROTOCOL_FEES_COLLECTOR_ADDRESS,
        [ethers.BigNumber.from("300000000000000000")]
      );

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createSwapFeeFinding("0.1"),
      createFlashLoanFeeFinding("0.1"),
      createSwapFeeFinding("2.0"),
      createFlashLoanFeeFinding("2.0"),
      createSwapFeeFinding("30.0"),
      createFlashLoanFeeFinding("30.0"),
    ]);
  });
});
