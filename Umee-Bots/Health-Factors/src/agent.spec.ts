import { HandleTransaction, ethers, HandleBlock, Initialize } from "forta-agent";
import { provideHandleTransaction, provideHandleBlock, provideInitialize } from "./agent";
import { AgentConfig, createFinding } from "./utils";
import { createAddress, TestTransactionEvent, MockEthersProvider, TestBlockEvent } from "forta-agent-tools/lib/tests";
import { AGGREGATE_ABI, BORROW_ABI, GET_USER_ACCOUNT_DATA_ABI, LATEST_ANSWER_ABI } from "./constants";
import BigNumber from "bignumber.js";

const DEFAULT_CONFIG: AgentConfig = {
  ignoreThreshold: "20",
  healthFactorThreshold: "1.05",
  upperThreshold: "2000000",
  ethUsdFeedAddress: createAddress("0xfeed"),
  lendingPoolAddress: createAddress("0x2001"),
};

const USER_ADDRESS = createAddress("0x1");
const MAINNET_MULTICALL_ADDRESS = "0xeefba1e63905ef1d7acba5a8513c70307c1ce441";
const LENDING_POOL_IFACE = new ethers.utils.Interface([BORROW_ABI, GET_USER_ACCOUNT_DATA_ABI]);
const FEED_IFACE = new ethers.utils.Interface([LATEST_ANSWER_ABI]);
const MULTICALL_IFACE = new ethers.utils.Interface([AGGREGATE_ABI]);
const ETH_TO_USD = ethers.BigNumber.from("200000000000");

function strToWadBn(value: string): ethers.BigNumber {
  return ethers.BigNumber.from(new BigNumber(value).shiftedBy(18).integerValue().toString(10));
}

function addOne(value: string): string {
  return new BigNumber(value).plus(1).toString(10);
}

function subOne(value: string): string {
  return new BigNumber(value).minus(1).toString(10);
}

function addBorrow(txEvent: TestTransactionEvent, lendingPoolAddress: string, userAddress: string) {
  return txEvent.addInterfaceEventLog(LENDING_POOL_IFACE.getEvent("Borrow"), lendingPoolAddress, [
    createAddress("0x0"),
    createAddress("0x0"),
    userAddress,
    ethers.BigNumber.from(0),
    ethers.BigNumber.from(0),
    ethers.BigNumber.from(0),
    ethers.BigNumber.from(0),
  ]);
}

function createMockProvider(): MockEthersProvider {
  const mockProvider = new MockEthersProvider();

  // @ts-ignore
  mockProvider.getNetwork = jest.fn().mockImplementation(() => ({ chainId: 1 }));

  return mockProvider;
}

function generateMockProviderCall(
  mockProvider: MockEthersProvider,
  onPoolCall: (userAddress: string) => { totalCollateralUsd: string; totalDebtUsd: string; healthFactor: string }
) {
  mockProvider.call = jest.fn().mockImplementation(({ data, to }, blockTag) => {
    to = to.toLowerCase();

    if (to === MAINNET_MULTICALL_ADDRESS) {
      const calls = MULTICALL_IFACE.decodeFunctionData(MULTICALL_IFACE.getFunction("aggregate"), data).calls;
      const args = calls.map((el: { target: string; callData: string }) => {
        return LENDING_POOL_IFACE.decodeFunctionData(LENDING_POOL_IFACE.getFunction("getUserAccountData"), el.callData);
      }) as Array<{ user: string }>;

      const accountsData = args.map((el) => onPoolCall(el.user));

      return MULTICALL_IFACE.encodeFunctionResult(MULTICALL_IFACE.getFunction("aggregate"), [
        ethers.BigNumber.from("0"),
        accountsData.map((el) => {
          return LENDING_POOL_IFACE.encodeFunctionResult(LENDING_POOL_IFACE.getFunction("getUserAccountData"), [
            strToWadBn(el.totalCollateralUsd).mul(ethers.BigNumber.from(10).pow(8)).div(ETH_TO_USD),
            strToWadBn(el.totalDebtUsd).mul(ethers.BigNumber.from(10).pow(8)).div(ETH_TO_USD),
            ethers.BigNumber.from("0"),
            ethers.BigNumber.from("0"),
            ethers.BigNumber.from("0"),
            strToWadBn(el.healthFactor),
          ]);
        }),
      ]);
    } else {
      return FEED_IFACE.encodeFunctionResult(FEED_IFACE.getFunction("latestAnswer"), [ETH_TO_USD]);
    }
  });
}

describe("health factors agent", () => {
  let handleTransaction: HandleTransaction;
  let handleBlock: HandleBlock;
  let initialize: Initialize;
  let accounts: Array<{ address: string; alerted: boolean }>;
  let mockProvider: MockEthersProvider;
  let provider: ethers.providers.Provider;

  beforeEach(async () => {
    mockProvider = createMockProvider();
    provider = mockProvider as unknown as ethers.providers.Provider;

    accounts = [];
    initialize = provideInitialize(accounts, provider);

    await initialize();
  });

  it("returns empty findings and doesn't add any accounts to monitor when handling an empty transaction", async () => {
    const txEvent = new TestTransactionEvent();
    handleTransaction = provideHandleTransaction(DEFAULT_CONFIG);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("adds address to monitor when there's a Borrow event from LendingPool", async () => {
    const txEvent = new TestTransactionEvent();
    handleTransaction = provideHandleTransaction(DEFAULT_CONFIG);

    addBorrow(txEvent, DEFAULT_CONFIG.lendingPoolAddress, USER_ADDRESS);
    addBorrow(txEvent, DEFAULT_CONFIG.lendingPoolAddress, createAddress("0x2"));

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
    expect(accounts).toStrictEqual([
      { address: USER_ADDRESS, alerted: false },
      { address: createAddress("0x2"), alerted: false },
    ]);
  });

  it("doesn't add addresses to monitor when there's a Borrow event from a different address", async () => {
    const txEvent = new TestTransactionEvent();
    handleTransaction = provideHandleTransaction(DEFAULT_CONFIG);

    addBorrow(txEvent, createAddress("0x0"), USER_ADDRESS);
    addBorrow(txEvent, createAddress("0x0"), createAddress("0x2"));

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
    expect(accounts).toStrictEqual([]);
  });

  it("returns empty findings when handling an empty block", async () => {
    generateMockProviderCall(mockProvider, () => ({
      totalCollateralUsd: "0",
      totalDebtUsd: "0",
      healthFactor: "0",
    }));

    handleBlock = provideHandleBlock(provider, DEFAULT_CONFIG);
    handleTransaction = provideHandleTransaction(DEFAULT_CONFIG);

    const blockEvent = new TestBlockEvent();
    const findings1 = await handleBlock(blockEvent);

    expect(findings1).toStrictEqual([]);
    expect(accounts).toStrictEqual([]);
  });

  it("removes accounts with less than `ignoreThreshold` in debt from the monitoring list", async () => {
    generateMockProviderCall(mockProvider, () => ({
      totalCollateralUsd: "0",
      totalDebtUsd: "0", // less than ignoreThreshold
      healthFactor: "0",
    }));

    handleBlock = provideHandleBlock(provider, DEFAULT_CONFIG);
    handleTransaction = provideHandleTransaction(DEFAULT_CONFIG);

    const txEvent = new TestTransactionEvent();
    addBorrow(txEvent, DEFAULT_CONFIG.lendingPoolAddress, USER_ADDRESS);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(accounts).toStrictEqual([{ address: USER_ADDRESS, alerted: false }]);

    expect(await handleBlock(new TestBlockEvent())).toStrictEqual([]);
    expect(accounts).toStrictEqual([]);
  });

  it("keeps account with at least `ignoreThreshold` in debt in the monitoring list", async () => {
    generateMockProviderCall(mockProvider, () => ({
      totalCollateralUsd: "0",
      totalDebtUsd: DEFAULT_CONFIG.ignoreThreshold,
      healthFactor: "0",
    }));

    handleBlock = provideHandleBlock(provider, DEFAULT_CONFIG);
    handleTransaction = provideHandleTransaction(DEFAULT_CONFIG);

    const txEvent = new TestTransactionEvent();
    addBorrow(txEvent, DEFAULT_CONFIG.lendingPoolAddress, USER_ADDRESS);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(accounts).toStrictEqual([{ address: USER_ADDRESS, alerted: false }]);

    expect(await handleBlock(new TestBlockEvent())).toStrictEqual([]);
    expect(accounts).toStrictEqual([{ address: USER_ADDRESS, alerted: false }]);
  });

  it("shouldn't add duplicate account entries to the monitoring list", async () => {
    generateMockProviderCall(mockProvider, () => ({
      totalCollateralUsd: "0",
      totalDebtUsd: DEFAULT_CONFIG.ignoreThreshold,
      healthFactor: "0",
    }));

    handleBlock = provideHandleBlock(provider, DEFAULT_CONFIG);
    handleTransaction = provideHandleTransaction(DEFAULT_CONFIG);

    const txEvent1 = new TestTransactionEvent();
    addBorrow(txEvent1, DEFAULT_CONFIG.lendingPoolAddress, USER_ADDRESS);

    expect(await handleTransaction(txEvent1)).toStrictEqual([]);
    expect(accounts).toStrictEqual([{ address: USER_ADDRESS, alerted: false }]);

    const txEvent2 = new TestTransactionEvent();
    addBorrow(txEvent2, DEFAULT_CONFIG.lendingPoolAddress, USER_ADDRESS);
    addBorrow(txEvent2, DEFAULT_CONFIG.lendingPoolAddress, createAddress("0x2"));

    expect(await handleTransaction(txEvent2)).toStrictEqual([]);
    expect(accounts).toStrictEqual([
      { address: USER_ADDRESS, alerted: false },
      { address: createAddress("0x2"), alerted: false },
    ]);

    const txEvent3 = new TestTransactionEvent();
    addBorrow(txEvent3, DEFAULT_CONFIG.lendingPoolAddress, USER_ADDRESS);
    addBorrow(txEvent2, DEFAULT_CONFIG.lendingPoolAddress, createAddress("0x2"));
    addBorrow(txEvent3, DEFAULT_CONFIG.lendingPoolAddress, createAddress("0x3"));
    addBorrow(txEvent3, DEFAULT_CONFIG.lendingPoolAddress, createAddress("0x3"));

    expect(await handleTransaction(txEvent3)).toStrictEqual([]);
    expect(accounts).toStrictEqual([
      { address: USER_ADDRESS, alerted: false },
      { address: createAddress("0x2"), alerted: false },
      { address: createAddress("0x3"), alerted: false },
    ]);
  });

  it("returns empty findings if the accounts health factor is equal to or greater than `healthFactorThreshold`", async () => {
    generateMockProviderCall(mockProvider, () => ({
      totalCollateralUsd: addOne(DEFAULT_CONFIG.upperThreshold),
      totalDebtUsd: DEFAULT_CONFIG.ignoreThreshold,
      healthFactor: DEFAULT_CONFIG.healthFactorThreshold,
    }));

    handleBlock = provideHandleBlock(provider, DEFAULT_CONFIG);
    handleTransaction = provideHandleTransaction(DEFAULT_CONFIG);

    const txEvent = new TestTransactionEvent();
    addBorrow(txEvent, DEFAULT_CONFIG.lendingPoolAddress, USER_ADDRESS);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(accounts).toStrictEqual([{ address: USER_ADDRESS, alerted: false }]);

    expect(await handleBlock(new TestBlockEvent())).toStrictEqual([]);
    expect(accounts).toStrictEqual([{ address: USER_ADDRESS, alerted: false }]);
  });

  it("returns empty findings if the accounts total collateral in USD is equal to or less than `upperThreshold`", async () => {
    generateMockProviderCall(mockProvider, () => ({
      totalCollateralUsd: DEFAULT_CONFIG.upperThreshold,
      totalDebtUsd: DEFAULT_CONFIG.ignoreThreshold,
      healthFactor: subOne(DEFAULT_CONFIG.healthFactorThreshold),
    }));

    handleBlock = provideHandleBlock(provider, DEFAULT_CONFIG);
    handleTransaction = provideHandleTransaction(DEFAULT_CONFIG);

    const txEvent = new TestTransactionEvent();
    addBorrow(txEvent, DEFAULT_CONFIG.lendingPoolAddress, USER_ADDRESS);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(accounts).toStrictEqual([{ address: USER_ADDRESS, alerted: false }]);

    expect(await handleBlock(new TestBlockEvent())).toStrictEqual([]);
    expect(accounts).toStrictEqual([{ address: USER_ADDRESS, alerted: false }]);
  });

  it("returns findings if the accounts total collateral in USD is greater than `upperThreshold`, total debt in USD is greater or equal than `ignoreThreshold` and health factor is less than `healthFactorThreshold`", async () => {
    generateMockProviderCall(mockProvider, () => ({
      totalCollateralUsd: addOne(DEFAULT_CONFIG.upperThreshold),
      totalDebtUsd: DEFAULT_CONFIG.ignoreThreshold,
      healthFactor: subOne(DEFAULT_CONFIG.healthFactorThreshold),
    }));

    handleBlock = provideHandleBlock(provider, DEFAULT_CONFIG);
    handleTransaction = provideHandleTransaction(DEFAULT_CONFIG);

    const txEvent = new TestTransactionEvent();
    addBorrow(txEvent, DEFAULT_CONFIG.lendingPoolAddress, USER_ADDRESS);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(accounts).toStrictEqual([{ address: USER_ADDRESS, alerted: false }]);

    expect(await handleBlock(new TestBlockEvent())).toStrictEqual([
      createFinding(
        USER_ADDRESS,
        new BigNumber(subOne(DEFAULT_CONFIG.healthFactorThreshold)),
        new BigNumber(addOne(DEFAULT_CONFIG.upperThreshold))
      ),
    ]);
    expect(accounts).toStrictEqual([{ address: USER_ADDRESS, alerted: true }]);
  });

  it("only returns one finding each time the health factor is less than `healthFactorThreshold`", async () => {
    generateMockProviderCall(mockProvider, () => ({
      totalCollateralUsd: addOne(DEFAULT_CONFIG.upperThreshold),
      totalDebtUsd: DEFAULT_CONFIG.ignoreThreshold,
      healthFactor: subOne(DEFAULT_CONFIG.healthFactorThreshold),
    }));

    handleBlock = provideHandleBlock(provider, DEFAULT_CONFIG);
    handleTransaction = provideHandleTransaction(DEFAULT_CONFIG);

    const txEvent = new TestTransactionEvent();
    addBorrow(txEvent, DEFAULT_CONFIG.lendingPoolAddress, USER_ADDRESS);

    // adds account to monitoring list
    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    expect(accounts).toStrictEqual([{ address: USER_ADDRESS, alerted: false }]);

    // emits a finding, health factor below threshold
    expect(await handleBlock(new TestBlockEvent())).toStrictEqual([
      createFinding(
        USER_ADDRESS,
        new BigNumber(subOne(DEFAULT_CONFIG.healthFactorThreshold)),
        new BigNumber(addOne(DEFAULT_CONFIG.upperThreshold))
      ),
    ]);
    expect(accounts).toStrictEqual([{ address: USER_ADDRESS, alerted: true }]);

    // shouldn't emit a finding again if the position situation hasn't changed
    expect(await handleBlock(new TestBlockEvent())).toStrictEqual([]);
    expect(accounts).toStrictEqual([{ address: USER_ADDRESS, alerted: true }]);

    // change the account's health factor to be above the health factor threshold
    generateMockProviderCall(mockProvider, () => ({
      totalCollateralUsd: addOne(DEFAULT_CONFIG.upperThreshold),
      totalDebtUsd: DEFAULT_CONFIG.ignoreThreshold,
      healthFactor: addOne(DEFAULT_CONFIG.healthFactorThreshold),
    }));

    // shouldn't emit a finding, above threshold
    expect(await handleBlock(new TestBlockEvent())).toStrictEqual([]);
    expect(accounts).toStrictEqual([{ address: USER_ADDRESS, alerted: false }]);

    // change the account's health factor to be, again, below the health factor threshold
    generateMockProviderCall(mockProvider, () => ({
      totalCollateralUsd: addOne(DEFAULT_CONFIG.upperThreshold),
      totalDebtUsd: DEFAULT_CONFIG.ignoreThreshold,
      healthFactor: subOne(DEFAULT_CONFIG.healthFactorThreshold),
    }));

    // should now emit a finding again
    expect(await handleBlock(new TestBlockEvent())).toStrictEqual([
      createFinding(
        USER_ADDRESS,
        new BigNumber(subOne(DEFAULT_CONFIG.healthFactorThreshold)),
        new BigNumber(addOne(DEFAULT_CONFIG.upperThreshold))
      ),
    ]);
    expect(accounts).toStrictEqual([{ address: USER_ADDRESS, alerted: true }]);
  });
});
