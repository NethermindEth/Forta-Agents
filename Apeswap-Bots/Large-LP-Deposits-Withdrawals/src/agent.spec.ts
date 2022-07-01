import { HandleTransaction, Finding, FindingSeverity, FindingType } from "forta-agent";
import { BigNumber, utils as ethers } from "ethers";
import { provideHandleTransaction } from "./agent";
import { Interface } from "@ethersproject/abi";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import utils from "./utils";
import { when } from "jest-when";
import { getCreate2Address } from "@ethersproject/address";
import { keccak256 } from "forta-agent/dist/sdk/utils";
import NetworkManager from "./network";

const mockEvent: string = "event MockEvent (address indexed sender, uint amount0, uint amount1)";
const mockIface: Interface = new Interface([mockEvent]);

//token0, token1, amount0, amount1, totalSupply, valid
const CASES: [string, string, string, string, BigNumber, boolean][] = [
  [
    createAddress("0xc459"),
    createAddress("0x2222"),
    "100000000000000000",
    "200000000000000",
    BigNumber.from(3534953498534),
    true,
  ],
  [
    createAddress("0xaaab"),
    createAddress("0xbaaa"),
    "200000000000000000",
    "300000000000000",
    BigNumber.from(8534953498534),
    true,
  ],
  [
    createAddress("0xcccc"),
    createAddress("0xdddd"),
    "300000000000000000",
    "400000000000000",
    BigNumber.from(13534953498534),
    true,
  ],
  [
    createAddress("0xc459"),
    createAddress("0x2222"),
    "8700000000000000000",
    "2500000000000000",
    BigNumber.from(3534953498534),
    true,
  ],
  [
    createAddress("0xc459"),
    createAddress("0x2222"),
    "4400000000000000001",
    "5500000500000700",
    BigNumber.from(3534953498534),
    true,
  ],
];

//token0, token1, amount0, amount1, totalSupply, valid
const FAIL_CASES: [string, string, string, string, BigNumber, boolean][] = [
  [
    createAddress("0xc459"),
    createAddress("0x2222"),
    "100", //low amount0
    "200", //low amount1
    BigNumber.from(3534953498534),
    true,
  ],
  [
    createAddress("0xaaab"),
    createAddress("0xbaaa"),
    "200000000000000000",
    "300000000000000",
    BigNumber.from(65000), // low totalSupply
    true,
  ],
];

//balance0, balance1
const BALANCES: BigNumber[][] = [
  [BigNumber.from(95344598534), BigNumber.from(34945853498)],
  [BigNumber.from(1953495), BigNumber.from(1349853)],
  [BigNumber.from(65976577567), BigNumber.from(1231234596599)],
];

const testCreateFinding = (
  event: string,
  pool: string,
  token0: string,
  amount0: string,
  token1: string,
  amount1: string
): Finding => {
  switch (event) {
    case "Mint":
      return Finding.fromObject({
        name: "Large LP Deposit in Apeswap pool",
        description: `${event} event with large amounts emitted from Apeswap pool`,
        alertId: "APESWAP-8-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Apeswap",
        metadata: {
          pool,
          token0,
          amount0,
          token1,
          amount1,
        },
      });
    default:
      return Finding.fromObject({
        name: "Large LP Withdrawal from Apeswap pool",
        description: `${event} event with large amount emitted from an Apeswap pool`,
        alertId: "APESWAP-8-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Apeswap",
        metadata: {
          pool,
          token0,
          amount0,
          token1,
          amount1,
        },
      });
  }
};

describe("Apeswap Large LP Deposit/Withdrawal bot test suite", () => {
  const mockGetPoolData = jest.fn();
  const mockGetPoolBalance = jest.fn();
  const mockFetcher = {
    getPoolData: mockGetPoolData,
    getPoolBalance: mockGetPoolBalance,
  };

  const mockNetworkManager: NetworkManager = {
    factory: createAddress("0xadd0"), 
    init: keccak256("0xababa"),
    setNetwork: jest.fn(),
  };

  const mockApePairCreate2 = (token0: string, token1: string): string => {
    let salt: string = ethers.solidityKeccak256(["address", "address"], [token0, token1]);
    return getCreate2Address(mockNetworkManager.factory, salt, mockNetworkManager.init).toLowerCase();
  };

  const TEST_POOL_SUPPLY_THRESHOLD: BigNumber = BigNumber.from(100000);
  const TEST_AMOUNT_THRESHOLD_PERCENTAGE: BigNumber = BigNumber.from(3);

  const handleTransaction: HandleTransaction = provideHandleTransaction(
    mockNetworkManager as any,
    mockApePairCreate2,
    mockFetcher as any,
    TEST_POOL_SUPPLY_THRESHOLD,
    TEST_AMOUNT_THRESHOLD_PERCENTAGE
  );

  beforeEach(() => {
    mockFetcher.getPoolBalance.mockClear();
    mockFetcher.getPoolData.mockClear();
  });

  it("should ignore other event logs on Apeswap pools", async () => {
    const pool: string = mockApePairCreate2(CASES[0][0], CASES[0][1]);
    when(mockGetPoolData).calledWith(43, pool).mockReturnValue([CASES[0][5], CASES[0][0], CASES[0][1], CASES[0][4]]);
    when(mockGetPoolBalance)
      .calledWith(43, pool, CASES[0][0], CASES[0][1])
      .mockReturnValue([BALANCES[0][0], BALANCES[0][1]]);

    const event = mockIface.getEvent("MockEvent");
    const log = mockIface.encodeEventLog(event, [pool, CASES[0][2], CASES[0][3]]);
    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setBlock(44)
      .addAnonymousEventLog(pool, log.data, ...log.topics);

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when there is a large LP withdrawal from a large Apeswap pool", async () => {
    const pool: string = mockApePairCreate2(CASES[1][0], CASES[1][1]);
    when(mockGetPoolData).calledWith(4003, pool).mockReturnValue([CASES[1][5], CASES[1][0], CASES[1][1], CASES[1][4]]);
    when(mockGetPoolBalance)
      .calledWith(4003, pool, CASES[1][0], CASES[1][1])
      .mockReturnValue([BALANCES[1][0], BALANCES[1][1]]);

    const event = utils.EVENTS_IFACE.getEvent("Burn");
    const log = utils.EVENTS_IFACE.encodeEventLog(event, [pool, CASES[1][2], CASES[1][3], createAddress("0xccbb")]);
    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setBlock(4004)
      .addAnonymousEventLog(pool, log.data, ...log.topics);

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      testCreateFinding("Burn", pool, CASES[1][0], CASES[1][2], CASES[1][1], CASES[1][3]),
    ]);
  });

  it("should ignore large LP deposits to a non-Apeswap pool", async () => {
    const pool: string = createAddress("0x6767"); //not Apeswap pool
    when(mockGetPoolData).calledWith(41003, pool).mockReturnValue([CASES[1][5], CASES[1][0], CASES[1][1], CASES[1][4]]);
    when(mockGetPoolBalance)
      .calledWith(41003, pool, CASES[1][0], CASES[1][1])
      .mockReturnValue([BALANCES[1][0], BALANCES[1][1]]);

    const event = utils.EVENTS_IFACE.getEvent("Mint");
    const log = utils.EVENTS_IFACE.encodeEventLog(event, [pool, CASES[1][2], CASES[1][3]]);
    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setBlock(41004)
      .addAnonymousEventLog(pool, log.data, ...log.topics);

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore non-large LP deposits/withdrawals", async () => {
    const pool: string = mockApePairCreate2(FAIL_CASES[0][0], FAIL_CASES[0][1]);
    when(mockGetPoolData)
      .calledWith(43003, pool)
      .mockReturnValue([FAIL_CASES[0][5], FAIL_CASES[0][0], FAIL_CASES[0][1], FAIL_CASES[0][4]]);
    when(mockGetPoolBalance)
      .calledWith(43003, pool, FAIL_CASES[0][0], FAIL_CASES[0][1])
      .mockReturnValue([BALANCES[0][0], BALANCES[0][1]]);

    const event = utils.EVENTS_IFACE.getEvent("Burn");
    const log = utils.EVENTS_IFACE.encodeEventLog(event, [
      pool,
      FAIL_CASES[0][2],
      FAIL_CASES[0][3],
      createAddress("0xccbb"),
    ]);
    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setBlock(43004)
      .addAnonymousEventLog(pool, log.data, ...log.topics);

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should not return a finding for non-large Apeswap pools", async () => {
    const pool: string = mockApePairCreate2(FAIL_CASES[1][0], FAIL_CASES[1][1]);
    when(mockGetPoolData)
      .calledWith(45003, pool)
      .mockReturnValue([FAIL_CASES[1][5], FAIL_CASES[1][0], FAIL_CASES[1][1], FAIL_CASES[1][4]]);
    when(mockGetPoolBalance)
      .calledWith(45003, pool, FAIL_CASES[1][0], FAIL_CASES[1][1])
      .mockReturnValue([BALANCES[1][0], BALANCES[1][1]]);

    const event = utils.EVENTS_IFACE.getEvent("Mint");
    const log = utils.EVENTS_IFACE.encodeEventLog(event, [pool, FAIL_CASES[1][2], FAIL_CASES[1][3]]);
    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setBlock(45004)
      .addAnonymousEventLog(pool, log.data, ...log.topics);

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return 3 findings when 3 large LP deposits/withdrawals from the same Apeswap pool are executed", async () => {
    const pool: string = mockApePairCreate2(CASES[0][0], CASES[0][1]);
    when(mockGetPoolData).calledWith(7774, pool).mockReturnValue([true, CASES[0][0], CASES[0][1], CASES[0][4]]);
    when(mockGetPoolBalance)
      .calledWith(7774, pool, CASES[0][0], CASES[0][1])
      .mockReturnValue([BALANCES[0][0], BALANCES[0][1]]);

    const event0 = utils.EVENTS_IFACE.getEvent("Burn");
    const event1 = utils.EVENTS_IFACE.getEvent("Mint");
    const log0 = utils.EVENTS_IFACE.encodeEventLog(event0, [pool, CASES[0][2], CASES[0][3], createAddress("0xccbb")]);
    const log1 = utils.EVENTS_IFACE.encodeEventLog(event0, [pool, CASES[3][2], CASES[3][3], createAddress("0x6789")]);
    const log2 = utils.EVENTS_IFACE.encodeEventLog(event1, [pool, CASES[4][2], CASES[4][3]]);
    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setBlock(7775)
      .addAnonymousEventLog(pool, log0.data, ...log0.topics)
      .addAnonymousEventLog(pool, log1.data, ...log1.topics)
      .addAnonymousEventLog(pool, log2.data, ...log2.topics);

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      testCreateFinding("Burn", pool, CASES[0][0], CASES[0][2], CASES[0][1], CASES[0][3]),
      testCreateFinding("Burn", pool, CASES[3][0], CASES[3][2], CASES[3][1], CASES[3][3]),
      testCreateFinding("Mint", pool, CASES[4][0], CASES[4][2], CASES[4][1], CASES[4][3]),
    ]);
  });

  it("should return 2 findings when 2 large LP deposits/withdrawals are executed in different Apeswap pools", async () => {
    const pool0: string = mockApePairCreate2(CASES[0][0], CASES[0][1]);
    when(mockGetPoolData).calledWith(77074, pool0).mockReturnValue([true, CASES[0][0], CASES[0][1], CASES[0][4]]);
    when(mockGetPoolBalance)
      .calledWith(77074, pool0, CASES[0][0], CASES[0][1])
      .mockReturnValue([BALANCES[0][0], BALANCES[0][1]]);

    const pool1: string = mockApePairCreate2(CASES[1][0], CASES[1][1]);
    when(mockGetPoolData).calledWith(77074, pool1).mockReturnValue([true, CASES[1][0], CASES[1][1], CASES[1][4]]);
    when(mockGetPoolBalance)
      .calledWith(77074, pool1, CASES[1][0], CASES[1][1])
      .mockReturnValue([BALANCES[1][0], BALANCES[1][1]]);

    const event0 = utils.EVENTS_IFACE.getEvent("Burn");
    const event1 = utils.EVENTS_IFACE.getEvent("Mint");
    const log0 = utils.EVENTS_IFACE.encodeEventLog(event0, [pool0, CASES[0][2], CASES[0][3], createAddress("0xafbb")]);
    const log1 = utils.EVENTS_IFACE.encodeEventLog(event1, [pool1, CASES[1][2], CASES[1][3]]);

    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setBlock(77075)
      .addAnonymousEventLog(pool0, log0.data, ...log0.topics)
      .addAnonymousEventLog(pool1, log1.data, ...log1.topics);

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      testCreateFinding("Burn", pool0, CASES[0][0], CASES[0][2], CASES[0][1], CASES[0][3]),
      testCreateFinding("Mint", pool1, CASES[1][0], CASES[1][2], CASES[1][1], CASES[1][3]),
    ]);
  });
});
