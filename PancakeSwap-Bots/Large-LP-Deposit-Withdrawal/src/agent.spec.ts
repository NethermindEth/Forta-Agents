import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  TransactionEvent,
  LogDescription,
} from "forta-agent";
import { BigNumber, utils } from "ethers";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { Interface } from "@ethersproject/abi";
import { when } from "jest-when";
import { provideHandleTransaction } from "./agent";
import { EVENTS_ABI } from "./constants";
import { getCreate2Address } from "@ethersproject/address";

const MOCK_IFACE: Interface = new Interface(EVENTS_ABI);
const MOCK_FACTORY: string = createAddress("0x1111");

const MOCK_POOL_SUPPLY_THRESHOLD: BigNumber = BigNumber.from(1000);
const MOCK_AMOUNT_THRESHOLD_PERCENTAGE: BigNumber = BigNumber.from(3);

// valid, token0, token1, amount0, amount1, totalSupply
const CASES: [boolean, string, string, string, string, BigNumber][] = [
  [
    true,
    createAddress("0xaa11"),
    createAddress("0xbb22"),
    "100000000000000000",
    "200000000000000",
    BigNumber.from(3534953498534)
  ],
  [
    true,
    createAddress("0xcc33"),
    createAddress("0xdd44"),
    "200000000000000000",
    "300000000000000",
    BigNumber.from(8534953498534),
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
    createAddress("0xc459"),
    createAddress("0x2222"),
    "8700000000000000000",
    "2500000000000000",
    BigNumber.from(3534953498534),
  ],
  [
    true,
    createAddress("0xc459"),
    createAddress("0x2222"),
    "4400000000000000001",
    "5500000500000700",
    BigNumber.from(3534953498534),
  ],
];

const testBlocks: number[] = [341530, 341531, 341532];

//balance0, balance1
const BALANCES: BigNumber[][] = [
  [BigNumber.from(95344598534), BigNumber.from(34945853498)],
  [BigNumber.from(1953495), BigNumber.from(1349853)],
  [BigNumber.from(65976577567), BigNumber.from(1231234596599)],
];

const mockCreatePair = (token0: string, token1: string, mockFactory: string): string => {
  let salt: string = utils.solidityKeccak256(["address", "address"], [token0, token1]);
  return getCreate2Address(mockFactory, salt, utils.keccak256("0xee99"));
};

const mockCeateFinding = (
  event: string,
  pool: string,
  token0: string,
  token1: string,
  amount0: string,
  amount1: string,
  totalSupply: string
): Finding => {
  const metadata = {
    pool,
    token0: token0,
    amount0: parseInt(amount0).toFixed(2),
    token1: token1,
    amount1: parseInt(amount1).toFixed(2),
    totalSupply: parseInt(totalSupply).toFixed(2),
  };

  if (event === "Mint") {
    return Finding.fromObject({
      name: "Large LP Deposit in Pancakeswap pool",
      description: `${event} event with large amounts emitted from Pancakeswap pool`,
      alertId: "CAKE-3-1",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "Pancakeswap",
      metadata,
    });
  } else
    return Finding.fromObject({
      name: "Large LP Withdrawal from Pancakeswap pool",
      description: `${event} event with large amount emitted from an Pancakeswap pool`,
      alertId: "CAKE-3-2",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "Apeswap",
      metadata,
    });
};

describe("Large LP Deposit/Withdraw Test Suite", () => {
 const mockGetPoolData = jest.fn()
 const mockGetPoolBalance = jest.fn()
  
  const mockPoolFetcher = {
    getPoolData: mockGetPoolData,
    getPoolBalance: mockGetPoolBalance
  };
  let handleTransaction: HandleTransaction = provideHandleTransaction(
    mockCreatePair,
    mockPoolFetcher as any,
    MOCK_POOL_SUPPLY_THRESHOLD,
    MOCK_AMOUNT_THRESHOLD_PERCENTAGE,
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

  it("should ignore other emitted events", async () => {
    const UNSUPPORTED_IFACE: Interface = new Interface(["event Sync (uint112 reserve0, uint112 reserve1)"]);
    const unsupportedEventLog = MOCK_IFACE.encodeEventLog(UNSUPPORTED_IFACE.getEvent("Sync"), [10, 10]);
    txEvent = new TestTransactionEvent().addAnonymousEventLog(unsupportedEventLog.data, ...unsupportedEventLog.topics);
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore large LP deposit to non-Pancakeswap pool", async () => {
    const otherPool: string = createAddress("0xff00");
    when(mockPoolFetcher.getPoolData)
      .calledWith(testBlocks[0] - 1, otherPool)
      .mockReturnValue([CASES[0][0], CASES[0][1], CASES[0][2], CASES[0][3]]);
    when(mockPoolFetcher.getPoolBalance).calledWith(testBlocks[0] - 1, otherPool, CASES[0][1], CASES[0][2])
    .mockReturnValue([BALANCES[1][0], BALANCES[1][1]])
    const event = MOCK_IFACE.getEvent("Mint");
    const eventLog = MOCK_IFACE.encodeEventLog(event, [otherPool, CASES[0][1], CASES[0][2]]);
    txEvent = new TestTransactionEvent()
      .setBlock(testBlocks[0])
      .addAnonymousEventLog(otherPool, eventLog.data, ...eventLog.topics);
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });
});
