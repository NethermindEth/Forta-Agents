import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { BigNumber, utils } from "ethers";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { Interface } from "@ethersproject/abi";
import { when } from "jest-when";
import { provideHandleTransaction } from "./agent";
import { EVENTS_ABI } from "./constants";
import { getCreate2Address } from "@ethersproject/address";

const MOCK_IFACE: Interface = new Interface(EVENTS_ABI);
const MOCK_FACTORY: string = createAddress("0x1111");

const MOCK_POOL_SUPPLY_THRESHOLD: BigNumber = BigNumber.from(10000);
const MOCK_THRESHOLD_PERCENTAGE: BigNumber = BigNumber.from(10);

// valid, token0, token1, amount0, amount1, totalSupply
const CASES: [boolean, string, string, string, string, BigNumber][] = [
  [
    true,
    createAddress("0xaa11"),
    createAddress("0xbb22"),
    "100000000000000000",
    "200000000000000",
    BigNumber.from(3534953498534),
  ],
  [
    true,
    createAddress("0xcc33"),
    createAddress("0xdd44"),
    "200000000000000000",
    "300000000000000",
    BigNumber.from(100000),
  ],
  [
    true,
    createAddress("0xcccc"),
    createAddress("0xdddd"),
    "300000000000000000",
    "400000000000000",
    BigNumber.from(13534953498534),
  ],
  [
    true,
    createAddress("0xeeee"),
    createAddress("0xffff"),
    "8700000000000000000",
    "2500000000000000",
    BigNumber.from(3534953498534),
  ],
  [
    true,
    createAddress("0xccdd99"),
    createAddress("0xeeff00"),
    "4400000000000000001",
    "5500000500000700",
    BigNumber.from(3534953498534),
  ],
];

// valid, token0, token1, amount0, amount1, totalSupply
const FAIL_CASES: [boolean, string, string, string, string, BigNumber][] = [
  [
    true,
    createAddress("0xc459"),
    createAddress("0x2222"),
    "100", //low amount0
    "200", //low amount1
    BigNumber.from(200000),
  ],
  [
    true,
    createAddress("0xaaab"),
    createAddress("0xbaaa"),
    "200000000000000000",
    "300000000000000",
    BigNumber.from(7500), // low totalSupply
  ],
];

const testBlocks: number[] = [341530, 341531, 341532];

//balance0, balance1
const BALANCES: BigNumber[][] = [
  [BigNumber.from(95344598534), BigNumber.from(34945853498)],
  [BigNumber.from(19535), BigNumber.from(13498)],
  [BigNumber.from(65976577567), BigNumber.from(1231234596599)],
];

const mockCreatePair = (token0: string, token1: string): string => {
  let salt: string = utils.solidityKeccak256(["address", "address"], [token0, token1]);
  return getCreate2Address(MOCK_FACTORY, salt, utils.keccak256("0xee99")).toLowerCase();
};

const mockCreateFinding = (
  event: string,
  pool: string,
  token0: string,
  token1: string,
  amount0: string,
  amount1: string,
  totalSupply: string
): Finding => {
  const metadata = {
    poolAddress: pool,
    token0: token0,
    amount0: amount0.toString(),
    token1: token1,
    amount1: amount1.toString(),
    totalSupply: totalSupply.toString(),
  };

  if (event === "Mint") {
    return Finding.fromObject({
      name: "Large LP Deposit in Pancakeswap pool",
      description: `${event} event with large amounts emitted from a Pancakeswap pool`,
      alertId: "CAKE-3-1",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "Pancakeswap",
      metadata,
    });
  }
  return Finding.fromObject({
    name: "Large LP Withdrawal from Pancakeswap pool",
    description: `${event} event with large amount emitted from a Pancakeswap pool`,
    alertId: "CAKE-3-2",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Pancakeswap",
    metadata,
  });
};

describe("Large LP Deposit/Withdraw Test Suite", () => {
  const mockGetPoolData = jest.fn();
  const mockGetPoolBalance = jest.fn();

  const mockPoolFetcher = {
    getPoolData: mockGetPoolData,
    getPoolBalance: mockGetPoolBalance,
  };
  let handleTransaction: HandleTransaction = provideHandleTransaction(
    mockCreatePair,
    mockPoolFetcher as any,
    MOCK_POOL_SUPPLY_THRESHOLD,
    MOCK_THRESHOLD_PERCENTAGE,
    MOCK_FACTORY
  );
  let txEvent: TransactionEvent;
  let findings: Finding[];

  beforeEach(() => {
    mockPoolFetcher.getPoolData.mockClear();
    mockPoolFetcher.getPoolBalance.mockClear();
  });

  it("should return no finding in empty transaction", async () => {
    txEvent = new TestTransactionEvent();
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore different emitted event", async () => {
    const DIFFERENT_IFACE: Interface = new Interface(["event Sync (uint112 reserve0, uint112 reserve1)"]);
    const differentEvent = MOCK_IFACE.encodeEventLog(DIFFERENT_IFACE.getEvent("Sync"), [10, 10]);
    txEvent = new TestTransactionEvent().addAnonymousEventLog(differentEvent.data, ...differentEvent.topics);
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore large LP deposit to non-Pancakeswap pool", async () => {
    const otherPool: string = createAddress("0xff00");
    when(mockGetPoolData)
      .calledWith(testBlocks[0], otherPool)
      .mockReturnValue([CASES[0][0], CASES[0][1], CASES[0][2], CASES[0][3]]);
    when(mockGetPoolBalance)
      .calledWith(testBlocks[0], otherPool, CASES[0][1], CASES[0][2])
      .mockReturnValue([BALANCES[1][0], BALANCES[1][1]]);
    const event: utils.EventFragment = MOCK_IFACE.getEvent("Mint");
    const eventLog = MOCK_IFACE.encodeEventLog(event, [otherPool, CASES[0][1], CASES[0][2]]);
    txEvent = new TestTransactionEvent()
      .setBlock(testBlocks[1])
      .addAnonymousEventLog(otherPool, eventLog.data, ...eventLog.topics);
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore small LP deposit to large Pancakeswap pools", async () => {
    const pool = mockCreatePair(FAIL_CASES[0][1], FAIL_CASES[0][2]);
    when(mockGetPoolData)
      .calledWith(testBlocks[1], pool)
      .mockReturnValue([FAIL_CASES[0][0], FAIL_CASES[0][1], FAIL_CASES[0][2], FAIL_CASES[0][5]]);
    when(mockGetPoolBalance)
      .calledWith(testBlocks[1], pool, FAIL_CASES[0][1], FAIL_CASES[0][2])
      .mockReturnValue([BALANCES[0][0], BALANCES[0][1]]);

    const event: utils.EventFragment = MOCK_IFACE.getEvent("Mint");
    const eventLog = MOCK_IFACE.encodeEventLog(event, [pool, FAIL_CASES[0][3], FAIL_CASES[0][4]]);
    txEvent = new TestTransactionEvent()
      .setBlock(testBlocks[2])
      .addAnonymousEventLog(pool, eventLog.data, ...eventLog.topics);
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore large deposits to small Pancakeswap pools", async () => {
    const pool = mockCreatePair(FAIL_CASES[1][1], FAIL_CASES[1][2]);
    when(mockGetPoolData)
      .calledWith(testBlocks[1], pool)
      .mockReturnValue([FAIL_CASES[1][0], FAIL_CASES[1][1], FAIL_CASES[1][2], FAIL_CASES[1][5]]);

    when(mockGetPoolBalance)
      .calledWith(testBlocks[1], pool, FAIL_CASES[1][1], FAIL_CASES[1][2])
      .mockReturnValue([BALANCES[1][0], BALANCES[1][1]]);

    const event: utils.EventFragment = MOCK_IFACE.getEvent("Mint");
    const eventLog = MOCK_IFACE.encodeEventLog(event, [pool, FAIL_CASES[1][3], FAIL_CASES[1][4]]);
    txEvent = new TestTransactionEvent()
      .setBlock(testBlocks[2])
      .addAnonymousEventLog(pool, eventLog.data, ...eventLog.topics);
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when there is large deposit to Pancakeswap pool", async () => {
    const pool: string = mockCreatePair(CASES[1][1], CASES[1][2]);
    when(mockGetPoolData)
      .calledWith(testBlocks[0], pool)
      .mockReturnValue([CASES[1][0], CASES[1][1], CASES[1][2], CASES[1][5]]);
    when(mockGetPoolBalance)
      .calledWith(testBlocks[0], pool, CASES[1][1], CASES[1][2])
      .mockReturnValue([BALANCES[1][0], BALANCES[1][1]]);

    const event = MOCK_IFACE.getEvent("Mint");
    const log = MOCK_IFACE.encodeEventLog(event, [pool, CASES[1][3], CASES[1][4]]);
    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setBlock(testBlocks[1])
      .addAnonymousEventLog(pool, log.data, ...log.topics);

    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      mockCreateFinding("Mint", pool, CASES[1][1], CASES[1][2], CASES[1][3], CASES[1][4], CASES[1][5].toString()),
    ]);
  });

  it("should return a finding when there is a large LP withdrawal from a Pancakeswap pool", async () => {
    const pool: string = mockCreatePair(CASES[1][1], CASES[1][2]);
    when(mockGetPoolData)
      .calledWith(testBlocks[0], pool)
      .mockReturnValue([CASES[1][0], CASES[1][1], CASES[1][2], CASES[1][5]]);
    when(mockGetPoolBalance)
      .calledWith(testBlocks[0], pool, CASES[1][1], CASES[1][2])
      .mockReturnValue([BALANCES[0][0], BALANCES[0][1]]);

    const event = MOCK_IFACE.getEvent("Burn");
    const log = MOCK_IFACE.encodeEventLog(event, [pool, CASES[1][3], CASES[1][4], createAddress("0x4050")]);
    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setBlock(testBlocks[1])
      .addAnonymousEventLog(pool, log.data, ...log.topics);

    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      mockCreateFinding("Burn", pool, CASES[1][1], CASES[1][2], CASES[1][3], CASES[1][4], CASES[1][5].toString()),
    ]);
  });

  it("should return multiple findings when there is a large LP deposit/withdrawal to/from a Pancakeswap pool", async () => {
    const pool: string = mockCreatePair(CASES[1][1], CASES[1][2]);
    when(mockGetPoolData)
      .calledWith(testBlocks[1], pool)
      .mockReturnValue([CASES[1][0], CASES[1][1], CASES[1][2], CASES[1][5]]);
    when(mockGetPoolBalance)
      .calledWith(testBlocks[1], pool, CASES[1][1], CASES[1][2])
      .mockReturnValue([BALANCES[2][0], BALANCES[2][1]]);

    const event0 = MOCK_IFACE.getEvent("Mint");
    const event1 = MOCK_IFACE.getEvent("Burn");
    const log0 = MOCK_IFACE.encodeEventLog(event0, [pool, CASES[1][3], CASES[1][4]]);
    const log1 = MOCK_IFACE.encodeEventLog(event0, [pool, CASES[2][3], CASES[2][4]]);
    const log2 = MOCK_IFACE.encodeEventLog(event1, [pool, CASES[3][3], CASES[3][4], createAddress("0x4050")]);
    const log3 = MOCK_IFACE.encodeEventLog(event1, [pool, CASES[4][3], CASES[4][4], createAddress("0x6070")]);

    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setBlock(testBlocks[2])
      .addAnonymousEventLog(pool, log0.data, ...log0.topics)
      .addAnonymousEventLog(pool, log1.data, ...log1.topics)
      .addAnonymousEventLog(pool, log2.data, ...log2.topics)
      .addAnonymousEventLog(pool, log3.data, ...log3.topics);

    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      mockCreateFinding("Mint", pool, CASES[1][1], CASES[1][2], CASES[1][3], CASES[1][4], CASES[1][5].toString()),
      mockCreateFinding("Mint", pool, CASES[1][1], CASES[1][2], CASES[2][3], CASES[2][4], CASES[1][5].toString()),
      mockCreateFinding("Burn", pool, CASES[1][1], CASES[1][2], CASES[3][3], CASES[3][4], CASES[1][5].toString()),
      mockCreateFinding("Burn", pool, CASES[1][1], CASES[1][2], CASES[4][3], CASES[4][4], CASES[1][5].toString()),
    ]);
  });
});