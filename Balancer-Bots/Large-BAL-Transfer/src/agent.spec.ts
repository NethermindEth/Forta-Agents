import { ethers, Finding, FindingSeverity, FindingType, HandleTransaction, Network } from "forta-agent";
import { BigNumber } from "bignumber.js";
import { NetworkManager } from "forta-agent-tools";
import { TestTransactionEvent, createAddress as padAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { TOKEN_ABI, EVENT } from "./constants";
import { AgentConfig, NetworkData, SmartCaller } from "./utils";

const createAddress = (address: string): string => ethers.utils.getAddress(padAddress(address.toLowerCase()));

const VAULT_IFACE = new ethers.utils.Interface(EVENT);
const IRRELEVANT_IFACE = new ethers.utils.Interface(["event Event()"]);
const TOKEN_IFACE = new ethers.utils.Interface(TOKEN_ABI);
const BAL_ADDRESS = createAddress("0x1");

const createFinding = (from: string, to: string, value: BigNumber, percentage: BigNumber): Finding => {
  return Finding.from({
    name: "Large BAL Transfer",
    description: `${value.shiftedBy(-18).decimalPlaces(5)} BAL (${percentage.decimalPlaces(
      5
    )}% of the total supply) transferred from ${from} to ${to}`,
    alertId: "BAL-7",
    protocol: "Balancer",
    severity: FindingSeverity.Low,
    type: FindingType.Info,
    metadata: {
      from,
      to,
      value: value.toString(10),
      percentage: percentage.toString(10),
    },
  });
};

const DEFAULT_CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    balToken: BAL_ADDRESS,
    threshold: "10",
  },
};

describe("Large BAL Token Transfer Bot Test Suite", () => {
  let provider: ethers.providers.Provider;
  let mockProvider: MockEthersProvider;
  let networkManager: NetworkManager<NetworkData>;
  let handleTransaction: HandleTransaction;

  beforeEach(() => {
    SmartCaller.clearCache();
    mockProvider = new MockEthersProvider();
    provider = mockProvider as unknown as ethers.providers.Provider;

    mockProvider.addCallTo(BAL_ADDRESS, 1, TOKEN_IFACE, "totalSupply", {
      inputs: [],
      outputs: ["50000000000000000000000000"],
    });

    networkManager = new NetworkManager(DEFAULT_CONFIG, Network.MAINNET);
    handleTransaction = provideHandleTransaction(networkManager, provider);
  });

  it("should return empty findings when no event is emitted", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should ignore target events emitted from another contract", async () => {
    const txEvent = new TestTransactionEvent()
      .addInterfaceEventLog(VAULT_IFACE.getEvent("Transfer"), createAddress("0xdead"), [
        createAddress("0x2"),
        createAddress("0x3"),
        ethers.BigNumber.from("6000000000000000000000000"),
      ])
      .setBlock(1);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(0);
  });

  it("should ignore other events emitted from target contract", async () => {
    const txEvent = new TestTransactionEvent()
      .addInterfaceEventLog(IRRELEVANT_IFACE.getEvent("Event"), BAL_ADDRESS)
      .setBlock(1);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(0);
  });

  it("should not return findings for transfers that are not large", async () => {
    const txEvent = new TestTransactionEvent()
      .addInterfaceEventLog(VAULT_IFACE.getEvent("Transfer"), BAL_ADDRESS, [
        createAddress("0x2"),
        createAddress("0x3"),
        ethers.BigNumber.from("4900000000000000000000000"),
      ])
      .setBlock(1);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(1);
  });

  it("should return findings for transfers that are large", async () => {
    const txEvent = new TestTransactionEvent()
      .addInterfaceEventLog(VAULT_IFACE.getEvent("Transfer"), BAL_ADDRESS, [
        createAddress("0x2"),
        createAddress("0x3"),
        ethers.BigNumber.from("5000000000000000000000000"),
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("Transfer"), BAL_ADDRESS, [
        createAddress("0x4"),
        createAddress("0x5"),
        ethers.BigNumber.from("6000000000000000000000000"),
      ])
      .setBlock(1);

    const percentage1 = new BigNumber("5000000000000000000000000")
      .multipliedBy(100)
      .dividedBy(new BigNumber("50000000000000000000000000"));

    const percentage2 = new BigNumber("6000000000000000000000000")
      .multipliedBy(100)
      .dividedBy(new BigNumber("50000000000000000000000000"));

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createFinding(
        createAddress("0x2"),
        createAddress("0x3"),
        new BigNumber("5000000000000000000000000"),
        percentage1
      ),
      createFinding(
        createAddress("0x4"),
        createAddress("0x5"),
        new BigNumber("6000000000000000000000000"),
        percentage2
      ),
    ]);
    expect(mockProvider.call).toHaveBeenCalledTimes(1);
  });
});
