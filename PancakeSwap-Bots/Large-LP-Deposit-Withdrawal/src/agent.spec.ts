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
import { provideHandleTransaction } from "./agent";
import { FACTORY, FUNCTIONS_ABI, POOL_SUPPLY_THRESHOLD, THRESHOLD_PERCENTAGE } from "./constants";
import { createPair } from "./utils";

const MOCK_POOL_SUPPLY_THRESHOLD: BigNumber = BigNumber.from(1000);
const MOCK_AMOUNT_THRESHOLD_PERCENTAGE: BigNumber = BigNumber.from(3);

const mockCeateFinding = (log: LogDescription, token0: string, token1: string, totalSupply: BigNumber): Finding => {
  const metadata = {
    pool: log.address,
    token0: token0,
    amount0: parseInt(utils.formatEther(log.args.amount0)).toFixed(2),
    token1: token1,
    amount1: parseInt(utils.formatEther(log.args.amount1)).toFixed(2),
    totalSupply: parseInt(utils.formatEther(totalSupply)).toFixed(2),
  };

  if (log.name === "Mint") {
    return Finding.fromObject({
      name: "Large LP Deposit in Pancakeswap pool",
      description: `${log.name} event with large amounts emitted from Pancakeswap pool`,
      alertId: "CAKE-3-1",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "Pancakeswap",
      metadata,
    });
  } else
    return Finding.fromObject({
      name: "Large LP Withdrawal from Pancakeswap pool",
      description: `${log.name} event with large amount emitted from an Pancakeswap pool`,
      alertId: "CAKE-3-2",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "Apeswap",
      metadata,
    });
};

describe("Large LP Deposit/Withdraw Test Suite", () => {
  let handleTransaction: HandleTransaction;
  let txEvent: TransactionEvent;
  let findings: Finding[];

  const mockPoolFetcher = {
    getPoolData: jest.fn(),
    getPoolBalance: jest.fn(),
  };

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(
      createPair,
      mockPoolFetcher as any,
      MOCK_POOL_SUPPLY_THRESHOLD,
      MOCK_AMOUNT_THRESHOLD_PERCENTAGE,
      FACTORY
    );
  });

  it("should return no finding in empty transaction", async () => {
    txEvent = new TestTransactionEvent();
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });
});
