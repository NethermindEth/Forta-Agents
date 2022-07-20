import { BigNumber } from "bignumber.js";
import { Interface } from "ethers/lib/utils";
import { FindingType, FindingSeverity, Finding, HandleTransaction, Network, ethers } from "forta-agent";
import { createAddress, MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import BalanceFetcher from "./balance.fetcher";
import { TOKEN_ABI, EVENT } from "./constants";
import { AgentConfig, NetworkData, toBn } from "./utils";
import { NetworkManager } from "forta-agent-tools";

const VAULT_IFACE = new Interface(EVENT);
const IRRELEVANT_IFACE = new ethers.utils.Interface(["event Event()"]);
const VAULT_ADDRESS = createAddress("0x1");

const createFinding = (
  user: string,
  token: string,
  delta: ethers.BigNumberish,
  percentage: BigNumber,
  symbol: string
) => {
  let action, alertId;

  if (ethers.BigNumber.from(delta).isNegative()) {
    action = "withdrawal";
    alertId = "BAL-2-1";
  } else {
    action = "deposit";
    alertId = "BAL-2-2";
  }

  return Finding.fromObject({
    name: `Large ${symbol} internal balance ${action}`,
    description: `User's (${user}) internal balance of ${symbol} has changed with large ${symbol} ${action} (${percentage
      .decimalPlaces(3)
      .toString(10)}% of Vault's ${symbol} balance)`,
    alertId,
    protocol: "Balancer",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      user: user.toLowerCase(),
      token: token.toLowerCase(),
      delta: delta.toString(),
      percentage: percentage.toString(10),
    },
  });
};

const DEFAULT_CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    vaultAddress: VAULT_ADDRESS,
    threshold: "10",
  },
};

describe("Large internal balance deposits/withdrawals", () => {
  let provider: ethers.providers.Provider;
  let mockProvider: MockEthersProvider;
  let mockBalanceFetcher: BalanceFetcher;
  let networkManager: NetworkManager<NetworkData>;
  let handleTransaction: HandleTransaction;

  const TEST_TOKEN = createAddress("0x2");

  const TEST_BALANCE = ethers.BigNumber.from("1000");
  const TEST_SYMBOL = "NETH";
  const TEST_BLOCK = 123;

  beforeEach(() => {
    mockProvider = new MockEthersProvider();
    provider = mockProvider as unknown as ethers.providers.Provider;

    mockProvider.addCallTo(TEST_TOKEN, TEST_BLOCK - 1, new Interface(TOKEN_ABI), "balanceOf", {
      inputs: [VAULT_ADDRESS],
      outputs: [TEST_BALANCE],
    });

    mockProvider.addCallTo(TEST_TOKEN, TEST_BLOCK - 1, new Interface(TOKEN_ABI), "symbol", {
      inputs: [],
      outputs: [TEST_SYMBOL],
    });

    networkManager = new NetworkManager(DEFAULT_CONFIG, Network.MAINNET);

    mockBalanceFetcher = new BalanceFetcher(mockProvider as any);

    handleTransaction = provideHandleTransaction(networkManager, mockBalanceFetcher);
  });

  it("returns empty findings for empty transactions", async () => {
    const txEvent = new TestTransactionEvent();

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore target events emitted from another contract", async () => {
    const txEvent = new TestTransactionEvent()
      .setBlock(TEST_BLOCK)
      .addInterfaceEventLog(VAULT_IFACE.getEvent("InternalBalanceChanged"), createAddress("0x2"), [
        createAddress("0x3"),
        TEST_TOKEN,
        "120",
      ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(0);
  });

  it("should ignore other events emitted from target contract", async () => {
    const txEvent = new TestTransactionEvent().addInterfaceEventLog(
      IRRELEVANT_IFACE.getEvent("Event"),
      VAULT_ADDRESS,
      []
    );

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(0);
  });

  it("should not return a finding for a deposit that is not large", async () => {
    const txEvent = new TestTransactionEvent()
      .setBlock(TEST_BLOCK)
      .addInterfaceEventLog(VAULT_IFACE.getEvent("InternalBalanceChanged"), VAULT_ADDRESS, [
        createAddress("0x3"),
        TEST_TOKEN,
        "90",
      ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(1);
  });

  it("should not return a finding for a withdrawal that is not large", async () => {
    const txEvent = new TestTransactionEvent()
      .setBlock(TEST_BLOCK)
      .addInterfaceEventLog(VAULT_IFACE.getEvent("InternalBalanceChanged"), VAULT_ADDRESS, [
        createAddress("0x3"),
        TEST_TOKEN,
        "-90",
      ]);
    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(1);
  });

  it("returns findings if there are deposits with a large amount", async () => {
    const txEvent = new TestTransactionEvent()
      .setBlock(TEST_BLOCK)
      .addInterfaceEventLog(VAULT_IFACE.getEvent("InternalBalanceChanged"), VAULT_ADDRESS, [
        createAddress("0x3"),
        TEST_TOKEN,
        "120",
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("InternalBalanceChanged"), VAULT_ADDRESS, [
        createAddress("0x4"),
        TEST_TOKEN,
        "110",
      ]);

    const findings: Finding[] = await handleTransaction(txEvent);

    const percentage1 = new BigNumber(120 * 100).dividedBy(toBn(TEST_BALANCE));
    const percentage2 = new BigNumber(110 * 100).dividedBy(toBn(TEST_BALANCE));

    expect(findings).toStrictEqual([
      createFinding(createAddress("0x3"), TEST_TOKEN, "120", percentage1, TEST_SYMBOL),
      createFinding(createAddress("0x4"), TEST_TOKEN, "110", percentage2, TEST_SYMBOL),
    ]);
    expect(mockProvider.call).toHaveBeenCalledTimes(4);
  });

  it("returns findings if there are withdrawals with a large amount", async () => {
    const txEvent = new TestTransactionEvent()
      .setBlock(TEST_BLOCK)
      .addInterfaceEventLog(VAULT_IFACE.getEvent("InternalBalanceChanged"), VAULT_ADDRESS, [
        createAddress("0x3"),
        TEST_TOKEN,
        "-120",
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("InternalBalanceChanged"), VAULT_ADDRESS, [
        createAddress("0x4"),
        TEST_TOKEN,
        "-110",
      ]);
    const findings: Finding[] = await handleTransaction(txEvent);

    const percentage1 = new BigNumber(120 * 100).dividedBy(toBn(TEST_BALANCE));
    const percentage2 = new BigNumber(110 * 100).dividedBy(toBn(TEST_BALANCE));

    expect(findings).toStrictEqual([
      createFinding(createAddress("0x3"), TEST_TOKEN, "-120", percentage1, TEST_SYMBOL),
      createFinding(createAddress("0x4"), TEST_TOKEN, "-110", percentage2, TEST_SYMBOL),
    ]);
    expect(mockProvider.call).toHaveBeenCalledTimes(4);
  });

  it("returns findings if there are withdrawals and deposits with large amounts", async () => {
    const txEvent = new TestTransactionEvent()
      .setBlock(TEST_BLOCK)
      .addInterfaceEventLog(VAULT_IFACE.getEvent("InternalBalanceChanged"), VAULT_ADDRESS, [
        createAddress("0x3"),
        TEST_TOKEN,
        "120",
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("InternalBalanceChanged"), VAULT_ADDRESS, [
        createAddress("0x4"),
        TEST_TOKEN,
        "-110",
      ]);

    const findings: Finding[] = await handleTransaction(txEvent);

    const percentage1 = new BigNumber(120 * 100).dividedBy(toBn(TEST_BALANCE));
    const percentage2 = new BigNumber(110 * 100).dividedBy(toBn(TEST_BALANCE));

    expect(findings).toStrictEqual([
      createFinding(createAddress("0x3"), TEST_TOKEN, "120", percentage1, TEST_SYMBOL),
      createFinding(createAddress("0x4"), TEST_TOKEN, "-110", percentage2, TEST_SYMBOL),
    ]);
    expect(mockProvider.call).toHaveBeenCalledTimes(4);
  });
});
