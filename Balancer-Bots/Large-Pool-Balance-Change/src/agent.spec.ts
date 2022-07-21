import { BigNumber } from "bignumber.js";
import { Interface, formatBytes32String } from "ethers/lib/utils";
import { FindingType, FindingSeverity, Finding, HandleTransaction, Network, ethers } from "forta-agent";
import { createAddress, MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleBlock } from "./agent";
import { TOKEN_ABI, EVENT } from "./constants";
import { AgentConfig, NetworkData, SmartCaller } from "./utils";
import { NetworkManager } from "forta-agent-tools";

const VAULT_IFACE = new Interface(EVENT);
const IRRELEVANT_IFACE = new ethers.utils.Interface(["event Event()"]);
const VAULT_ADDRESS = createAddress("0x1");

const createFinding = (data: any) => {
  let action, alertId, text;

  if (data.delta.isNegative()) {
    action = "exit";
    alertId = "BAL-5-1";
    text = "decreased";
  } else {
    action = "join";
    alertId = "BAL-5-2";
    text = "increased";
  }

  return Finding.fromObject({
    name: `Large pool ${action}`,
    description: `Pool's (${formatBytes32String(data.poolId)}) ${
      data.tokenSymbol
    } balance has ${text} by ${data.percentage.decimalPlaces(1).toString(10)}% after a large ${action}`,
    alertId,
    protocol: "Balancer",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      poolId: formatBytes32String(data.poolId),
      previousBalance: data.previousBalance.toString(10),
      token: data.token.toLowerCase(),
      delta: data.delta.toString(10),
      percentage: data.percentage.toString(10),
    },
  });
};

const DEFAULT_CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    vaultAddress: VAULT_ADDRESS,
    threshold: "10",
  },
};

describe("Large pool balance changes", () => {
  let provider: ethers.providers.Provider;
  let mockProvider: MockEthersProvider;
  let networkManager: NetworkManager<NetworkData>;
  let handleTransaction: HandleTransaction;

  const TEST_POOL_TOKEN_INFO: any = [
    [createAddress("0x1"), createAddress("0x2")],
    [ethers.BigNumber.from("1000"), ethers.BigNumber.from("2000")],
    ethers.BigNumber.from("1"),
  ];

  const TEST_POOLID = "0x2";

  const TEST_POOL_TOKEN_SYMBOLS: string[] = ["NETH", "MIND"];

  beforeEach(() => {
    SmartCaller.clearCache();
    mockProvider = new MockEthersProvider();
    provider = mockProvider as unknown as ethers.providers.Provider;

    mockProvider.addCallTo(VAULT_ADDRESS, 1, new Interface(TOKEN_ABI), "getPoolTokens", {
      inputs: [formatBytes32String(TEST_POOLID)],
      outputs: TEST_POOL_TOKEN_INFO,
    });

    mockProvider.addCallTo(createAddress("0x1"), 1, new Interface(TOKEN_ABI), "symbol", {
      inputs: [],
      outputs: [TEST_POOL_TOKEN_SYMBOLS[0]],
    });

    mockProvider.addCallTo(createAddress("0x2"), 1, new Interface(TOKEN_ABI), "symbol", {
      inputs: [],
      outputs: [TEST_POOL_TOKEN_SYMBOLS[1]],
    });

    networkManager = new NetworkManager(DEFAULT_CONFIG, Network.MAINNET);

    handleTransaction = provideHandleBlock(networkManager, provider);
  });

  it("returns empty findings for empty transactions", async () => {
    const txEvent = new TestTransactionEvent();

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore target events emitted from another contract", async () => {
    const txEvent = new TestTransactionEvent()
      .setBlock(1)
      .addInterfaceEventLog(VAULT_IFACE.getEvent("PoolBalanceChanged"), createAddress("0x2"), [
        formatBytes32String(TEST_POOLID),
        createAddress("0x3"),
        [TEST_POOL_TOKEN_INFO[0][0], TEST_POOL_TOKEN_INFO[0][1]],
        [ethers.BigNumber.from(200), ethers.BigNumber.from(50)],
        [ethers.BigNumber.from(1), ethers.BigNumber.from(2)],
      ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(0);
  });

  it("should ignore other events emitted from target contract", async () => {
    const txEvent = new TestTransactionEvent()
      .setBlock(1)
      .addInterfaceEventLog(IRRELEVANT_IFACE.getEvent("Event"), VAULT_ADDRESS, []);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(0);
  });

  it("should not return findings for pool joins that are not large", async () => {
    const txEvent = new TestTransactionEvent()
      .setBlock(1)
      .addInterfaceEventLog(VAULT_IFACE.getEvent("PoolBalanceChanged"), VAULT_ADDRESS, [
        formatBytes32String(TEST_POOLID),
        createAddress("0x3"),
        [TEST_POOL_TOKEN_INFO[0][0], TEST_POOL_TOKEN_INFO[0][1]],
        [ethers.BigNumber.from(80), ethers.BigNumber.from(50)],
        [ethers.BigNumber.from(1), ethers.BigNumber.from(2)],
      ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(1);
  });

  it("should not return findings for pool exits that are not large", async () => {
    const txEvent = new TestTransactionEvent()
      .setBlock(1)
      .addInterfaceEventLog(VAULT_IFACE.getEvent("PoolBalanceChanged"), VAULT_ADDRESS, [
        formatBytes32String(TEST_POOLID),
        createAddress("0x3"),
        [TEST_POOL_TOKEN_INFO[0][0], TEST_POOL_TOKEN_INFO[0][1]],
        [ethers.BigNumber.from(-80), ethers.BigNumber.from(-50)],
        [ethers.BigNumber.from(1), ethers.BigNumber.from(2)],
      ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(1);
  });

  it("returns findings if there are pool joins with a large amount", async () => {
    const txEvent = new TestTransactionEvent()
      .setBlock(1)
      .addInterfaceEventLog(VAULT_IFACE.getEvent("PoolBalanceChanged"), VAULT_ADDRESS, [
        formatBytes32String(TEST_POOLID),
        createAddress("0x3"),
        [TEST_POOL_TOKEN_INFO[0][0], TEST_POOL_TOKEN_INFO[0][1]],
        [ethers.BigNumber.from(180), ethers.BigNumber.from(50)],
        [ethers.BigNumber.from(1), ethers.BigNumber.from(2)],
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("PoolBalanceChanged"), VAULT_ADDRESS, [
        formatBytes32String(TEST_POOLID),
        createAddress("0x3"),
        [TEST_POOL_TOKEN_INFO[0][0], TEST_POOL_TOKEN_INFO[0][1]],
        [ethers.BigNumber.from(80), ethers.BigNumber.from(350)],
        [ethers.BigNumber.from(1), ethers.BigNumber.from(2)],
      ]);

    const delta1 = new BigNumber("180");
    const previousBalance1 = new BigNumber(TEST_POOL_TOKEN_INFO[1][0].toString()).minus(delta1).toString();
    const delta2 = new BigNumber("350");
    const previousBalance2 = new BigNumber(TEST_POOL_TOKEN_INFO[1][1].toString()).minus(delta2).toString();

    const data1 = {
      poolId: TEST_POOLID,
      previousBalance: previousBalance1,
      token: TEST_POOL_TOKEN_INFO[0][0],
      delta: delta1,
      tokenSymbol: TEST_POOL_TOKEN_SYMBOLS[0],
      percentage: delta1.abs().multipliedBy(100).dividedBy(previousBalance1).decimalPlaces(1),
    };

    const data2 = {
      poolId: TEST_POOLID,
      previousBalance: previousBalance2,
      token: TEST_POOL_TOKEN_INFO[0][1],
      delta: delta2,
      tokenSymbol: TEST_POOL_TOKEN_SYMBOLS[1],
      percentage: delta2.abs().multipliedBy(100).dividedBy(previousBalance2).decimalPlaces(1),
    };

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([createFinding(data1), createFinding(data2)]);
    expect(mockProvider.call).toHaveBeenCalledTimes(3);
  });

  it("returns findings if there are pool exits with a large amount", async () => {
    const txEvent = new TestTransactionEvent()
      .setBlock(1)
      .addInterfaceEventLog(VAULT_IFACE.getEvent("PoolBalanceChanged"), VAULT_ADDRESS, [
        formatBytes32String(TEST_POOLID),
        createAddress("0x3"),
        [TEST_POOL_TOKEN_INFO[0][0], TEST_POOL_TOKEN_INFO[0][1]],
        [ethers.BigNumber.from(-180), ethers.BigNumber.from(-50)],
        [ethers.BigNumber.from(1), ethers.BigNumber.from(2)],
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("PoolBalanceChanged"), VAULT_ADDRESS, [
        formatBytes32String(TEST_POOLID),
        createAddress("0x3"),
        [TEST_POOL_TOKEN_INFO[0][0], TEST_POOL_TOKEN_INFO[0][1]],
        [ethers.BigNumber.from(-80), ethers.BigNumber.from(-350)],
        [ethers.BigNumber.from(1), ethers.BigNumber.from(2)],
      ]);

    const delta1 = new BigNumber("-180");
    const previousBalance1 = new BigNumber(TEST_POOL_TOKEN_INFO[1][0].toString()).minus(delta1).toString();
    const delta2 = new BigNumber("-350");
    const previousBalance2 = new BigNumber(TEST_POOL_TOKEN_INFO[1][1].toString()).minus(delta2).toString();

    const data1 = {
      poolId: TEST_POOLID,
      previousBalance: previousBalance1,
      token: TEST_POOL_TOKEN_INFO[0][0],
      delta: delta1,
      tokenSymbol: TEST_POOL_TOKEN_SYMBOLS[0],
      percentage: delta1.abs().multipliedBy(100).dividedBy(previousBalance1).decimalPlaces(1),
    };

    const data2 = {
      poolId: TEST_POOLID,
      previousBalance: previousBalance2,
      token: TEST_POOL_TOKEN_INFO[0][1],
      delta: delta2,
      tokenSymbol: TEST_POOL_TOKEN_SYMBOLS[1],
      percentage: delta2.abs().multipliedBy(100).dividedBy(previousBalance2).decimalPlaces(1),
    };

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([createFinding(data1), createFinding(data2)]);
    expect(mockProvider.call).toHaveBeenCalledTimes(3);
  });

  it("returns findings if there are pool joins and exits with large amounts", async () => {
    const txEvent = new TestTransactionEvent()
      .setBlock(1)
      .addInterfaceEventLog(VAULT_IFACE.getEvent("PoolBalanceChanged"), VAULT_ADDRESS, [
        formatBytes32String(TEST_POOLID),
        createAddress("0x3"),
        [TEST_POOL_TOKEN_INFO[0][0], TEST_POOL_TOKEN_INFO[0][1]],
        [ethers.BigNumber.from(180), ethers.BigNumber.from(50)],
        [ethers.BigNumber.from(1), ethers.BigNumber.from(2)],
      ])
      .addInterfaceEventLog(VAULT_IFACE.getEvent("PoolBalanceChanged"), VAULT_ADDRESS, [
        formatBytes32String(TEST_POOLID),
        createAddress("0x3"),
        [TEST_POOL_TOKEN_INFO[0][0], TEST_POOL_TOKEN_INFO[0][1]],
        [ethers.BigNumber.from(80), ethers.BigNumber.from(-350)],
        [ethers.BigNumber.from(1), ethers.BigNumber.from(2)],
      ]);

    const delta1 = new BigNumber("180");
    const previousBalance1 = new BigNumber(TEST_POOL_TOKEN_INFO[1][0].toString()).minus(delta1).toString();
    const delta2 = new BigNumber("-350");
    const previousBalance2 = new BigNumber(TEST_POOL_TOKEN_INFO[1][1].toString()).minus(delta2).toString();

    const data1 = {
      poolId: TEST_POOLID,
      previousBalance: previousBalance1,
      token: TEST_POOL_TOKEN_INFO[0][0],
      delta: delta1,
      tokenSymbol: TEST_POOL_TOKEN_SYMBOLS[0],
      percentage: delta1.abs().multipliedBy(100).dividedBy(previousBalance1).decimalPlaces(1),
    };

    const data2 = {
      poolId: TEST_POOLID,
      previousBalance: previousBalance2,
      token: TEST_POOL_TOKEN_INFO[0][1],
      delta: delta2,
      tokenSymbol: TEST_POOL_TOKEN_SYMBOLS[1],
      percentage: delta2.abs().multipliedBy(100).dividedBy(previousBalance2).decimalPlaces(1),
    };

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([createFinding(data1), createFinding(data2)]);
    expect(mockProvider.call).toHaveBeenCalledTimes(3);
  });
});
