import { BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import {
  createAddress,
  MockEthersProvider,
  TestTransactionEvent,
} from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import MarketsFetcher from "./markets.fetcher";
import NetworkData from "./network";
import SupplyFetcher from "./supply.fetcher";
import { EVENTS_ABIS, SUPPLY_IFACE } from "./utils";

describe("Large BankerJoe transfers test suites", () => {
  let handleTransaction: HandleTransaction;

  const TEST_MARKETS = [
    createAddress("0x11"),
    createAddress("0x22"),
    createAddress("0x33"),
  ];
  const TEST_DATA = [
    [createAddress("0x9fd"), BigNumber.from(20), BigNumber.from(90)], // `Mint` below threshold
    [createAddress("0x9fd"), BigNumber.from(20), BigNumber.from(90)], // `Redeem` below threshold
    [
      createAddress("0x9fd"),
      BigNumber.from(90),
      BigNumber.from(11),
      BigNumber.from(20),
    ], // `Borrow` below threshold

    [createAddress("0x9fd"), BigNumber.from(10), BigNumber.from(120)], // `Mint` above threshold
    [createAddress("0x9fd"), BigNumber.from(20), BigNumber.from(240)], // `Redeem` above threshold
    [
      createAddress("0x9fd"),
      BigNumber.from(500),
      BigNumber.from(11),
      BigNumber.from(20),
    ], // `Borrow` above threshold
  ];

  const mockNetworkManager: NetworkData = {
    joeTroller: createAddress("0x0ae"),
    networkMap: {},
    setNetwork: jest.fn(),
  };
  const mockProvider = new MockEthersProvider();
  const mockMarketsFetcher = new MarketsFetcher(mockProvider as any);
  const mockSupplyFetcher = new SupplyFetcher(mockProvider as any);
  const EVENTS_IFACE = new Interface(EVENTS_ABIS);
  const TEST_BLOCK = 10;

  const addCallToTotalSupply = (
    market: string,
    block: number | string,
    supply: BigNumber
  ) => {
    mockProvider.addCallTo(market, block, SUPPLY_IFACE, "totalSupply", {
      inputs: [],
      outputs: [supply],
    });
  };

  const createFinding = (
    name: string,
    jToken: string,
    args: any[]
  ): Finding => {
    if (name === "Mint")
      return Finding.fromObject({
        name: `Large minted amount detected on BankerJoe`,
        description: `${name} event detected on a jToken contract with a large amount`,
        protocol: "TraderJoe",
        alertId: "TraderJoe-21-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          minter: args[0].toLowerCase(),
          mintAmount: args[1].toString(),
          mintTokens: args[2].toString(),
        },
        addresses: [jToken],
      });
    else {
      if (name === "Redeem")
        return Finding.fromObject({
          name: `Large redeemed amount detected on BankerJoe`,
          description: `${name} event detected on a jToken contract with a large amount`,
          protocol: "TraderJoe",
          alertId: "TraderJoe-21-2",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
            redeemer: args[0].toLowerCase(),
            redeemAmount: args[1].toString(),
            redeemTokens: args[2].toString(),
          },
          addresses: [jToken],
        });
      else
        return Finding.fromObject({
          name: `Large borrowed amount detected on BankerJoe`,
          description: `${name} event detected on a jToken contract with a large amount`,
          protocol: "TraderJoe",
          alertId: "TraderJoe-21-3",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
            borrower: args[0].toLowerCase(),
            borrowAmount: args[1].toString(),
            accountBorrows: args[2].toString(),
            totalBorrows: args[3].toString(),
          },
          addresses: [jToken],
        });
    }
  };

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(
      mockNetworkManager,
      mockMarketsFetcher,
      mockSupplyFetcher
    );
    mockMarketsFetcher.markets = new Set(TEST_MARKETS);
  });

  it("should ignore empty transactions", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore events on other contracts", async () => {
    const differentContract = createAddress("0x44");

    const log1 = EVENTS_IFACE.encodeEventLog(
      EVENTS_IFACE.getEvent("Mint"),
      TEST_DATA[3]
    );
    const log2 = EVENTS_IFACE.encodeEventLog(
      EVENTS_IFACE.getEvent("Redeem"),
      TEST_DATA[4]
    );
    const log3 = EVENTS_IFACE.encodeEventLog(
      EVENTS_IFACE.getEvent("Borrow"),
      TEST_DATA[5]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(differentContract, log1.data, ...log1.topics)
      .addAnonymousEventLog(differentContract, log2.data, ...log2.topics)
      .addAnonymousEventLog(differentContract, log3.data, ...log3.topics);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore Mints, Redeems, Borrows with an amount below threshold", async () => {
    addCallToTotalSupply(TEST_MARKETS[0], TEST_BLOCK - 1, BigNumber.from(1000));

    const log1 = EVENTS_IFACE.encodeEventLog(
      EVENTS_IFACE.getEvent("Mint"),
      TEST_DATA[0]
    );
    const log2 = EVENTS_IFACE.encodeEventLog(
      EVENTS_IFACE.getEvent("Redeem"),
      TEST_DATA[1]
    );
    const log3 = EVENTS_IFACE.encodeEventLog(
      EVENTS_IFACE.getEvent("Borrow"),
      TEST_DATA[2]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(TEST_BLOCK)
      .addAnonymousEventLog(TEST_MARKETS[0], log1.data, ...log1.topics)
      .addAnonymousEventLog(TEST_MARKETS[0], log2.data, ...log2.topics)
      .addAnonymousEventLog(TEST_MARKETS[0], log3.data, ...log3.topics);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should detect Mints on a jToken with an amount above threshold", async () => {
    addCallToTotalSupply(TEST_MARKETS[0], TEST_BLOCK - 1, BigNumber.from(1000));

    const log1 = EVENTS_IFACE.encodeEventLog(
      EVENTS_IFACE.getEvent("Mint"),
      TEST_DATA[3]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(TEST_BLOCK)
      .addAnonymousEventLog(TEST_MARKETS[0], log1.data, ...log1.topics);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      createFinding("Mint", TEST_MARKETS[0], TEST_DATA[3]),
    ]);
  });

  it("should detect Redeems on a jToken with an amount above threshold", async () => {
    addCallToTotalSupply(TEST_MARKETS[1], TEST_BLOCK - 1, BigNumber.from(2000));

    const log1 = EVENTS_IFACE.encodeEventLog(
      EVENTS_IFACE.getEvent("Redeem"),
      TEST_DATA[4]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(TEST_BLOCK)
      .addAnonymousEventLog(TEST_MARKETS[1], log1.data, ...log1.topics);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      createFinding("Redeem", TEST_MARKETS[1], TEST_DATA[4]),
    ]);
  });

  it("should detect Borrows on a jToken with an amount above threshold", async () => {
    addCallToTotalSupply(TEST_MARKETS[2], TEST_BLOCK - 1, BigNumber.from(3000));

    const log1 = EVENTS_IFACE.encodeEventLog(
      EVENTS_IFACE.getEvent("Borrow"),
      TEST_DATA[5]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(TEST_BLOCK)
      .addAnonymousEventLog(TEST_MARKETS[2], log1.data, ...log1.topics);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      createFinding("Borrow", TEST_MARKETS[2], TEST_DATA[5]),
    ]);
  });

  it("should detect Mints, Redeems, Borrows with an amount above threshold", async () => {
    addCallToTotalSupply(TEST_MARKETS[0], TEST_BLOCK - 1, BigNumber.from(1000));
    addCallToTotalSupply(TEST_MARKETS[1], TEST_BLOCK - 1, BigNumber.from(2000));
    addCallToTotalSupply(TEST_MARKETS[2], TEST_BLOCK - 1, BigNumber.from(3000));

    const log1 = EVENTS_IFACE.encodeEventLog(
      EVENTS_IFACE.getEvent("Mint"),
      TEST_DATA[3]
    );
    const log2 = EVENTS_IFACE.encodeEventLog(
      EVENTS_IFACE.getEvent("Redeem"),
      TEST_DATA[4]
    );
    const log3 = EVENTS_IFACE.encodeEventLog(
      EVENTS_IFACE.getEvent("Borrow"),
      TEST_DATA[5]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(TEST_BLOCK)
      .addAnonymousEventLog(TEST_MARKETS[0], log1.data, ...log1.topics)
      .addAnonymousEventLog(TEST_MARKETS[1], log2.data, ...log2.topics)
      .addAnonymousEventLog(TEST_MARKETS[2], log3.data, ...log3.topics);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      createFinding("Mint", TEST_MARKETS[0], TEST_DATA[3]),
      createFinding("Redeem", TEST_MARKETS[1], TEST_DATA[4]),
      createFinding("Borrow", TEST_MARKETS[2], TEST_DATA[5]),
    ]);
  });
});
