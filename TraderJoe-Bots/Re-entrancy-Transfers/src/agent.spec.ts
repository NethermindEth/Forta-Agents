import { BigNumber, Transaction } from "ethers";
import { Interface } from "ethers/lib/utils";
import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent,
  TransactionEvent,
  Trace,
  TraceAction,
} from "forta-agent";
import { MockEthersProvider } from "forta-agent-tools/lib/mock.utils";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests.utils";
import { provideHandleTransaction } from "./agent";
import MarketsFetcher from "./markets.fetcher";
import NetworkData from "./network";
import { FUNCTIONS_ABIS, MARKET_UPDATE_ABIS } from "./utils";

describe("Re-entrancy transfers bot test suite", () => {
  let handleTransaction: HandleTransaction;

  const USER_ADDR = createAddress("0xc1");
  const TEST_MARKETS = [createAddress("0x11"), createAddress("0x22"), createAddress("0x33")];
  const FUNCTIONS_IFACE = new Interface(FUNCTIONS_ABIS);
  const mockNetworkManager: NetworkData = {
    joeTroller: createAddress("0x0ae"),
    sJoeStaking: createAddress("0x1ae"),
    masterChefV2: createAddress("0x2ae"),
    moneyMaker: createAddress("0x3ae"),
    networkMap: {},
    setNetwork: jest.fn(),
  };
  const mockProvider = new MockEthersProvider();
  const mockFetcher = new MarketsFetcher(mockProvider as any);
  const mockUpdateMarkets = jest.fn();

  const createTrace = (from: string, traceAddress: number[], to: string, input: string): Trace => {
    return {
      action: {
        from,
        to,
        input,
      } as TraceAction,
      traceAddress,
    } as Trace;
  };

  const createFinding = (
    from: string,
    address: string,
    rentrancyFrom: string,
    initialCall: string,
    reEtrantCall: string
  ) => {
    return Finding.fromObject({
      name: "Re-entrancy detected on a Trader Joe contract",
      description: "A function call to a Trader Joe contract resulted in another call to the same contract",
      alertId: "TRADERJOE-25",
      protocol: "TraderJoe",
      severity: FindingSeverity.High,
      type: FindingType.Exploit,
      metadata: {
        from: from, // address initializing the call.
        initialCall: initialCall, // functions that was called in our contract and resulted in a re-entrancy.
        entrancyFrom: rentrancyFrom, // the contract re-entring our contract.
        reEtrantCall: reEtrantCall, // second call to the same traderJoe contract.
      },
      addresses: [address],
    });
  };

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(mockNetworkManager as any, mockFetcher);
    mockFetcher.markets = new Set(TEST_MARKETS);
    mockFetcher.updateMarkets = mockUpdateMarkets;
  });

  beforeEach(() => mockUpdateMarkets.mockClear());

  it("should ignore empty transactions", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore calls when no re-entrancy happens", async () => {
    const traces = [
      createTrace(
        USER_ADDR,
        [],
        mockNetworkManager.sJoeStaking,
        FUNCTIONS_IFACE.encodeFunctionData("withdraw(uint256)", [BigNumber.from("1000")])
      ),
    ];

    const txEvent: TransactionEvent = createTransactionEvent({
      traces: traces,
    } as any);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore when sub-calls are on other contracts", async () => {
    const traces = [
      createTrace(
        USER_ADDR,
        [],
        mockNetworkManager.sJoeStaking,
        FUNCTIONS_IFACE.encodeFunctionData("withdraw(uint256)", [BigNumber.from("1000")])
      ),
      createTrace(
        USER_ADDR,
        [0],
        createAddress("0xff"),
        FUNCTIONS_IFACE.encodeFunctionData("withdraw(uint256)", [BigNumber.from("1000")])
      ),
    ];

    const txEvent: TransactionEvent = createTransactionEvent({
      traces: traces,
    } as any);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when a re-entrancy is detected in first sub-trace", async () => {
    const data = {
      from: USER_ADDR,
      to: mockNetworkManager.sJoeStaking,
    };
    const traces = [
      createTrace(
        USER_ADDR,
        [],
        mockNetworkManager.sJoeStaking,
        FUNCTIONS_IFACE.encodeFunctionData("withdraw(uint256)", [BigNumber.from("1000")])
      ),
      createTrace(
        USER_ADDR,
        [0],
        mockNetworkManager.sJoeStaking,
        FUNCTIONS_IFACE.encodeFunctionData("withdraw(uint256)", [BigNumber.from("2000")])
      ),
    ];

    const txEvent: TransactionEvent = createTransactionEvent({
      transaction: data as Transaction,
      traces: traces,
    } as any);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      createFinding(
        USER_ADDR,
        mockNetworkManager.sJoeStaking,
        USER_ADDR,
        FUNCTIONS_IFACE.encodeFunctionData("withdraw(uint256)", [BigNumber.from("1000")]).slice(0, 10),
        FUNCTIONS_IFACE.encodeFunctionData("withdraw(uint256)", [BigNumber.from("2000")]).slice(0, 10)
      ),
    ]);
  });

  it("should return a finding when a re-entrancy is detected in first sub-trace on a market", async () => {
    const data = {
      from: USER_ADDR,
      to: mockNetworkManager.sJoeStaking,
    };
    const traces = [
      createTrace(
        USER_ADDR,
        [],
        TEST_MARKETS[0],
        FUNCTIONS_IFACE.encodeFunctionData("transfer", [USER_ADDR, BigNumber.from("1000")])
      ),
      createTrace(
        USER_ADDR,
        [0],
        TEST_MARKETS[0],
        FUNCTIONS_IFACE.encodeFunctionData("transfer", [USER_ADDR, BigNumber.from("2000")])
      ),
    ];

    const txEvent: TransactionEvent = createTransactionEvent({
      transaction: data as Transaction,
      traces: traces,
    } as any);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      createFinding(
        USER_ADDR,
        TEST_MARKETS[0],
        USER_ADDR,
        FUNCTIONS_IFACE.encodeFunctionData("transfer", [USER_ADDR, BigNumber.from("1000")]).slice(0, 10),
        FUNCTIONS_IFACE.encodeFunctionData("transfer", [USER_ADDR, BigNumber.from("2000")]).slice(0, 10)
      ),
    ]);
  });

  it("should return a finding when a re-entrancy is detected in a deep sub-trace", async () => {
    const data = { from: USER_ADDR, to: mockNetworkManager.sJoeStaking };
    const traces = [
      createTrace(
        USER_ADDR,
        [],
        createAddress("0xff"),
        FUNCTIONS_IFACE.encodeFunctionData("withdraw(uint256)", [BigNumber.from("200")])
      ),
      createTrace(
        // first call to sJoeStaking contract.
        USER_ADDR,
        [0],
        mockNetworkManager.sJoeStaking,
        FUNCTIONS_IFACE.encodeFunctionData("withdraw(uint256)", [BigNumber.from("1000")])
      ),
      createTrace(
        USER_ADDR,
        [0, 0],
        createAddress("0xff"),
        FUNCTIONS_IFACE.encodeFunctionData("withdraw(uint256)", [BigNumber.from("2000")])
      ),
      createTrace(
        USER_ADDR,
        [0, 1],
        createAddress("0xff"),
        FUNCTIONS_IFACE.encodeFunctionData("withdraw(uint256)", [BigNumber.from("3000")])
      ),
      createTrace(
        // re-entrancy call to sJoeStaking contract.
        USER_ADDR,
        [0, 1, 0],
        mockNetworkManager.sJoeStaking,
        FUNCTIONS_IFACE.encodeFunctionData("withdraw(uint256)", [BigNumber.from("4000")])
      ),
    ];

    const txEvent: TransactionEvent = createTransactionEvent({
      transaction: data as Transaction,
      traces: traces,
    } as any);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      createFinding(
        USER_ADDR,
        mockNetworkManager.sJoeStaking,
        USER_ADDR,
        FUNCTIONS_IFACE.encodeFunctionData("withdraw(uint256)", [BigNumber.from("1000")]).slice(0, 10),
        FUNCTIONS_IFACE.encodeFunctionData("withdraw(uint256)", [BigNumber.from("4000")]).slice(0, 10)
      ),
    ]);
  });

  it("should return two findings when two re-entrant calls are detected", async () => {
    const data = { from: USER_ADDR };
    const traces = [
      createTrace(
        USER_ADDR,
        [],
        createAddress("0xff"),
        FUNCTIONS_IFACE.encodeFunctionData("withdraw(uint256)", [BigNumber.from("200")])
      ),
      createTrace(
        // call to MasterChefV2 contract.
        USER_ADDR,
        [0],
        mockNetworkManager.masterChefV2,
        FUNCTIONS_IFACE.encodeFunctionData("withdraw(uint256,uint256)", [BigNumber.from("1"), BigNumber.from("1000")])
      ),
      createTrace(
        USER_ADDR,
        [0, 0],
        createAddress("0xff"),
        FUNCTIONS_IFACE.encodeFunctionData("withdraw(uint256)", [BigNumber.from("2000")])
      ),
      createTrace(
        // re-entrancy call to MasterChefV2 contract.
        USER_ADDR,
        [0, 0, 1],
        mockNetworkManager.masterChefV2,
        FUNCTIONS_IFACE.encodeFunctionData("emergencyWithdraw(uint256)", [BigNumber.from("1")])
      ),
      createTrace(
        USER_ADDR,
        [1],
        createAddress("0xff"),
        FUNCTIONS_IFACE.encodeFunctionData("withdraw(uint256)", [BigNumber.from("200")])
      ),
      createTrace(
        USER_ADDR,
        [2],
        createAddress("0xff"),
        FUNCTIONS_IFACE.encodeFunctionData("withdraw(uint256)", [BigNumber.from("200")])
      ),
      createTrace(
        // call to MoneyMaker contract.
        USER_ADDR,
        [2, 0],
        mockNetworkManager.moneyMaker,
        FUNCTIONS_IFACE.encodeFunctionData("convert", [
          createAddress("0xfdeacd"),
          createAddress("0xddeacd"),
          BigNumber.from(1),
        ])
      ),
      createTrace(
        // re-entrancy call to MoneyMaker contract.
        USER_ADDR,
        [2, 0, 0],
        mockNetworkManager.moneyMaker,
        FUNCTIONS_IFACE.encodeFunctionData("convert", [
          createAddress("0x1deacd"),
          createAddress("0x2deacd"),
          BigNumber.from(2),
        ])
      ),
    ];

    const txEvent: TransactionEvent = createTransactionEvent({
      transaction: data as Transaction,
      traces: traces,
    } as any);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(
        USER_ADDR,
        mockNetworkManager.masterChefV2,
        USER_ADDR,
        FUNCTIONS_IFACE.encodeFunctionData("withdraw(uint256,uint256)", [
          BigNumber.from("1"),
          BigNumber.from("1000"),
        ]).slice(0, 10),
        FUNCTIONS_IFACE.encodeFunctionData("emergencyWithdraw(uint256)", [BigNumber.from("1")]).slice(0, 10)
      ),
      createFinding(
        USER_ADDR,
        mockNetworkManager.moneyMaker,
        USER_ADDR,
        FUNCTIONS_IFACE.encodeFunctionData("convert", [
          createAddress("0xfdeacd"),
          createAddress("0xddeacd"),
          BigNumber.from(1),
        ]).slice(0, 10),
        FUNCTIONS_IFACE.encodeFunctionData("convert", [
          createAddress("0x1deacd"),
          createAddress("0x2deacd"),
          BigNumber.from(2),
        ]).slice(0, 10)
      ),
    ]);
  });

  it("should listen to MarketListed events on JoeTroller contract", async () => {
    const MARKET_UPDATES_IFACE = new Interface(MARKET_UPDATE_ABIS);
    const newMarket = createAddress("0x123");

    const log1 = MARKET_UPDATES_IFACE.encodeEventLog(MARKET_UPDATES_IFACE.getEvent("MarketListed"), [newMarket]);

    const txEvent: TransactionEvent = new TestTransactionEvent().addAnonymousEventLog(
      mockNetworkManager.joeTroller,
      log1.data,
      ...log1.topics
    );

    await handleTransaction(txEvent);
    expect(mockFetcher.updateMarkets).toBeCalledTimes(1);
    expect(mockFetcher.updateMarkets).toBeCalledWith("MarketListed", newMarket);
  });

  it("should listen to MarketDelisted events on JoeTroller contract only", async () => {
    const MARKET_UPDATES_IFACE = new Interface(MARKET_UPDATE_ABIS);

    const oldMarket = TEST_MARKETS[2];
    const log1 = MARKET_UPDATES_IFACE.encodeEventLog(MARKET_UPDATES_IFACE.getEvent("MarketDelisted"), [oldMarket]);

    const txEvent: TransactionEvent = new TestTransactionEvent().addAnonymousEventLog(
      mockNetworkManager.joeTroller,
      log1.data,
      ...log1.topics
    );

    await handleTransaction(txEvent);
    expect(mockFetcher.updateMarkets).toBeCalledTimes(1);
    expect(mockFetcher.updateMarkets).toBeCalledWith("MarketDelisted", oldMarket);
  });
});
