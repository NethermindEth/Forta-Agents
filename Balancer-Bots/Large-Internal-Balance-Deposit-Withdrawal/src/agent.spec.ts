import { BigNumber } from "bignumber.js";
import { Interface } from "ethers/lib/utils";
import { FindingType, FindingSeverity, Finding, HandleBlock, Network, ethers } from "forta-agent";
import { createAddress, MockEthersProvider, TestBlockEvent } from "forta-agent-tools/lib/tests";
import { provideHandleBlock } from "./agent";
import BalanceFetcher from "./balance.fetcher";
import { TOKEN_ABI, EVENT } from "./constants";
import { AgentConfig, NetworkData, toBn } from "./utils";
import { NetworkManager } from "forta-agent-tools";

const VAULT_IFACE = new Interface(EVENT);
const IRRELEVANT_IFACE = new ethers.utils.Interface(["event Event()"]);
const VAULT_ADDRESS = createAddress("0x1");

const getInternalBalanceChangeLog = (
  emitter: string,
  block: number,
  user: string,
  token: string,
  delta: ethers.BigNumberish
): ethers.providers.Log => {
  return {
    address: emitter,
    blockNumber: block,
    ...VAULT_IFACE.encodeEventLog(VAULT_IFACE.getEvent("InternalBalanceChanged"), [
      user,
      token,
      ethers.BigNumber.from(delta),
    ]),
  } as ethers.providers.Log;
};

const getIrrelevantEvent = (emitter: string, block: number): ethers.providers.Log => {
  return {
    address: emitter,
    blockNumber: block,
    ...IRRELEVANT_IFACE.encodeEventLog(IRRELEVANT_IFACE.getEvent("Event"), []),
  } as ethers.providers.Log;
};

const createFinding = (user: string, token: string, delta: ethers.BigNumberish, percentage: BigNumber) => {
  let action, alertId;

  if (ethers.BigNumber.from(delta).isNegative()) {
    action = "withdrawal";
    alertId = "BAL-2-1";
  } else {
    action = "deposit";
    alertId = "BAL-2-2";
  }

  return Finding.fromObject({
    name: `Large internal balance ${action}`,
    description: `InternalBalanceChanged event detected with large ${action}`,
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
  let handleBlock: HandleBlock;

  const TEST_TOKEN = createAddress("0x2");

  const TEST_BALANCE = ethers.BigNumber.from("1000");
  const TEST_BLOCK = 123;

  beforeEach(() => {
    mockProvider = new MockEthersProvider();
    provider = mockProvider as unknown as ethers.providers.Provider;

    mockProvider.addCallTo(TEST_TOKEN, TEST_BLOCK - 1, new Interface(TOKEN_ABI), "balanceOf", {
      inputs: [VAULT_ADDRESS],
      outputs: [TEST_BALANCE],
    });

    networkManager = new NetworkManager(DEFAULT_CONFIG, Network.MAINNET);

    mockBalanceFetcher = new BalanceFetcher(mockProvider as any);

    handleBlock = provideHandleBlock(provider, networkManager, mockBalanceFetcher);
  });

  it("returns empty findings for empty transactions", async () => {
    const blockEvent = new TestBlockEvent();

    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore target events emitted from another contract", async () => {
    const blockEvent = new TestBlockEvent().setNumber(TEST_BLOCK);

    mockProvider.addLogs([
      getInternalBalanceChangeLog(createAddress("0x3"), TEST_BLOCK, createAddress("0x1"), TEST_TOKEN, "120"),
    ]);

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(0);
  });

  it("should ignore other events emitted from target contract", async () => {
    const blockEvent = new TestBlockEvent().setNumber(TEST_BLOCK);

    mockProvider.addLogs([getIrrelevantEvent(VAULT_ADDRESS, TEST_BLOCK)]);

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(0);
  });

  it("should ignore events emitted in other blocks", async () => {
    const blockEvent = new TestBlockEvent().setNumber(TEST_BLOCK);

    mockProvider.addLogs([getInternalBalanceChangeLog(VAULT_ADDRESS, 1, createAddress("0x3"), TEST_TOKEN, "120")]);

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(0);
  });

  it("should not return findings for deposit that are not large", async () => {
    const blockEvent = new TestBlockEvent().setNumber(TEST_BLOCK);

    mockProvider.addLogs([
      getInternalBalanceChangeLog(VAULT_ADDRESS, TEST_BLOCK, createAddress("0x3"), TEST_TOKEN, "90"),
    ]);

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(1);
  });

  it("should not return findings for withdrawal that are not large", async () => {
    const blockEvent = new TestBlockEvent().setNumber(TEST_BLOCK);

    mockProvider.addLogs([
      getInternalBalanceChangeLog(VAULT_ADDRESS, TEST_BLOCK, createAddress("0x3"), TEST_TOKEN, "-90"),
    ]);

    expect(await handleBlock(blockEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(1);
  });

  it("returns findings if there are deposits with a large amount", async () => {
    const blockEvent = new TestBlockEvent().setNumber(TEST_BLOCK);

    mockProvider.addLogs([
      getInternalBalanceChangeLog(VAULT_ADDRESS, TEST_BLOCK, createAddress("0x3"), TEST_TOKEN, "120"),
      getInternalBalanceChangeLog(VAULT_ADDRESS, TEST_BLOCK, createAddress("0x4"), TEST_TOKEN, "110"),
    ]);

    const findings: Finding[] = await handleBlock(blockEvent);

    const percentage1 = new BigNumber(120 * 100).dividedBy(toBn(TEST_BALANCE));
    const percentage2 = new BigNumber(110 * 100).dividedBy(toBn(TEST_BALANCE));

    expect(findings).toStrictEqual([
      createFinding(createAddress("0x3"), TEST_TOKEN, "120", percentage1),
      createFinding(createAddress("0x4"), TEST_TOKEN, "110", percentage2),
    ]);
    expect(mockProvider.call).toHaveBeenCalledTimes(2);
  });

  it("returns findings if there are withdrawals with a large amount", async () => {
    const blockEvent = new TestBlockEvent().setNumber(TEST_BLOCK);

    mockProvider.addLogs([
      getInternalBalanceChangeLog(VAULT_ADDRESS, TEST_BLOCK, createAddress("0x3"), TEST_TOKEN, "-120"),
      getInternalBalanceChangeLog(VAULT_ADDRESS, TEST_BLOCK, createAddress("0x4"), TEST_TOKEN, "-110"),
    ]);

    const findings: Finding[] = await handleBlock(blockEvent);

    const percentage1 = new BigNumber(120 * 100).dividedBy(toBn(TEST_BALANCE));
    const percentage2 = new BigNumber(110 * 100).dividedBy(toBn(TEST_BALANCE));

    expect(findings).toStrictEqual([
      createFinding(createAddress("0x3"), TEST_TOKEN, "-120", percentage1),
      createFinding(createAddress("0x4"), TEST_TOKEN, "-110", percentage2),
    ]);
    expect(mockProvider.call).toHaveBeenCalledTimes(2);
  });

  it("returns findings if there are withdrawals and deposits with large amounts", async () => {
    const blockEvent = new TestBlockEvent().setNumber(TEST_BLOCK);

    mockProvider.addLogs([
      getInternalBalanceChangeLog(VAULT_ADDRESS, TEST_BLOCK, createAddress("0x3"), TEST_TOKEN, "120"),
      getInternalBalanceChangeLog(VAULT_ADDRESS, TEST_BLOCK, createAddress("0x4"), TEST_TOKEN, "-110"),
    ]);

    const findings: Finding[] = await handleBlock(blockEvent);

    const percentage1 = new BigNumber(120 * 100).dividedBy(toBn(TEST_BALANCE));
    const percentage2 = new BigNumber(110 * 100).dividedBy(toBn(TEST_BALANCE));

    expect(findings).toStrictEqual([
      createFinding(createAddress("0x3"), TEST_TOKEN, "120", percentage1),
      createFinding(createAddress("0x4"), TEST_TOKEN, "-110", percentage2),
    ]);
    expect(mockProvider.call).toHaveBeenCalledTimes(2);
  });
});
