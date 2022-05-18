import { BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { MockEthersProvider } from "forta-agent-tools/lib/mock.utils";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests.utils";
import { provideHandleTransaction } from "./agent";
import BalanceFetcher from "./balance.fetcher";
import { APPROVAL_EVENT, BALANCEOF_ABI } from "./utils";

describe("Large spending approval tests suite", () => {
  let handler: HandleTransaction;
  let mockProvider = new MockEthersProvider();
  const EVENT_IFACE = new Interface(APPROVAL_EVENT);
  const BALANCEOF_IFACE = new Interface(BALANCEOF_ABI);

  const mockNetworkManager = {
    dydxAddress: createAddress("0xa1"),
    usdcAddress: createAddress("0xa2"),
    safetyModule: createAddress("0xa3"),
    liquidityModule: createAddress("0xa4"),
  };
  const mockFetcher = new BalanceFetcher(mockProvider as any, mockNetworkManager as any);
  const TEST_PERCENTAGE = 20;
  const TOTAL_STAKED = 1000;

  const TEST_DATA: [string, string, BigNumber][] = [
    [createAddress("0xb01"), createAddress("0xb02"), BigNumber.from(300)], // above threshold
    [createAddress("0xb11"), createAddress("0xb21"), BigNumber.from(500)], // above threshold
    [createAddress("0xb12"), createAddress("0xb22"), BigNumber.from(20)], // below threshold
    [createAddress("0xb13"), createAddress("0xb23"), BigNumber.from(100)], // below threshold
  ];
  const TEST_BLOCKS = [10, 20, 30, 40];
  const createBalanceOfCall = (tokenAddress: string, module: string, balance: BigNumber, blockNumber: number) => {
    mockProvider.addCallTo(tokenAddress, blockNumber, BALANCEOF_IFACE, "balanceOf", {
      inputs: [module],
      outputs: [balance],
    });
  };

  const createFinding = (module: string, args: [string, string, BigNumber]) => {
    return Finding.fromObject({
      name: `Large spending approval detected on ${module}`,
      description: `Approval event was emitted with a large value`,
      alertId: module === "Liquidity Module" ? "DYDX-19-1" : "DYDX-19-2",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "dYdX",
      metadata: {
        value: args[2].toString(),
        owner: args[0].toLowerCase(),
        spender: args[1].toLowerCase(),
      },
    });
  };

  beforeAll(() => {
    handler = provideHandleTransaction(mockNetworkManager as any, mockFetcher, TEST_PERCENTAGE);
  });

  it("should ignore empty transactions", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings = await handler(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding for Approval events on Safety module with large value", async () => {
    // Approval event with large value
    const log = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("Approval"), [
      TEST_DATA[0][0],
      TEST_DATA[0][1],
      TEST_DATA[0][2],
    ]);
    // createCall for balance Of for safety module.
    createBalanceOfCall(
      mockNetworkManager.dydxAddress,
      mockNetworkManager.safetyModule,
      BigNumber.from(TOTAL_STAKED),
      TEST_BLOCKS[0] - 1
    );
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(TEST_BLOCKS[0])
      .addAnonymousEventLog(mockNetworkManager.safetyModule, log.data, ...log.topics);

    const findings = await handler(txEvent);
    expect(findings).toStrictEqual([createFinding("Safety Module", TEST_DATA[0])]);
  });

  it("should return a finding for Approval events on Liquidity module with large value", async () => {
    // Approval event with large value
    const log = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("Approval"), [
      TEST_DATA[0][0],
      TEST_DATA[0][1],
      TEST_DATA[0][2],
    ]);
    // createCall for balance Of for Liquidity modules.
    createBalanceOfCall(
      mockNetworkManager.usdcAddress,
      mockNetworkManager.liquidityModule,
      BigNumber.from(TOTAL_STAKED),
      TEST_BLOCKS[1] - 1
    );
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(TEST_BLOCKS[1])
      .addAnonymousEventLog(mockNetworkManager.liquidityModule, log.data, ...log.topics);

    const findings = await handler(txEvent);
    expect(findings).toStrictEqual([createFinding("Liquidity Module", TEST_DATA[0])]);
  });

  it("should ignore Approval events on different contracts", async () => {
    // Approval event with large value on different contract
    const log = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("Approval"), [
      TEST_DATA[0][0],
      TEST_DATA[0][1],
      TEST_DATA[0][2],
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(TEST_BLOCKS[1])
      .addAnonymousEventLog(createAddress("0xfe"), log.data, ...log.topics);

    const findings = await handler(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore Approval events on Safety module with value below threshold", async () => {
    // Approval event with regular value
    const log = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("Approval"), [
      TEST_DATA[2][0],
      TEST_DATA[2][1],
      TEST_DATA[2][2],
    ]);
    // createCall for balance Of for safety module.
    createBalanceOfCall(
      mockNetworkManager.dydxAddress,
      mockNetworkManager.safetyModule,
      BigNumber.from(TOTAL_STAKED),
      TEST_BLOCKS[2] - 1
    );
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(TEST_BLOCKS[2])
      .addAnonymousEventLog(mockNetworkManager.safetyModule, log.data, ...log.topics);

    const findings = await handler(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore Approval events on Liquidity module with value below threshold", async () => {
    // Approval event with regular value
    const log = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("Approval"), [
      TEST_DATA[3][0],
      TEST_DATA[3][1],
      TEST_DATA[3][2],
    ]);
    // createCall for balance Of for Liquidity modules.
    createBalanceOfCall(
      mockNetworkManager.usdcAddress,
      mockNetworkManager.liquidityModule,
      BigNumber.from(TOTAL_STAKED),
      TEST_BLOCKS[3] - 1
    );
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(TEST_BLOCKS[3])
      .addAnonymousEventLog(mockNetworkManager.liquidityModule, log.data, ...log.topics);

    const findings = await handler(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return multiple findings for multiple Approval events with a large value", async () => {
    // Approval event with large value
    const log1 = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("Approval"), [
      TEST_DATA[0][0],
      TEST_DATA[0][1],
      TEST_DATA[0][2],
    ]);
    // Approval event with large value
    const log2 = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("Approval"), [
      TEST_DATA[1][0],
      TEST_DATA[1][1],
      TEST_DATA[1][2],
    ]);
    // Approval event with regular value
    const log3 = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("Approval"), [
      TEST_DATA[2][0],
      TEST_DATA[2][1],
      TEST_DATA[2][2],
    ]);
    // Approval event with regular value
    const log4 = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("Approval"), [
      TEST_DATA[3][0],
      TEST_DATA[3][1],
      TEST_DATA[3][2],
    ]);

    // createCall for balance Of for Liquidity modules.
    createBalanceOfCall(
      mockNetworkManager.usdcAddress,
      mockNetworkManager.liquidityModule,
      BigNumber.from(TOTAL_STAKED),
      TEST_BLOCKS[0] - 1
    );
    // createCall for balance Of for Safety modules.
    createBalanceOfCall(
      mockNetworkManager.dydxAddress,
      mockNetworkManager.safetyModule,
      BigNumber.from(TOTAL_STAKED),
      TEST_BLOCKS[0] - 1
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(TEST_BLOCKS[0])
      .addAnonymousEventLog(mockNetworkManager.liquidityModule, log1.data, ...log1.topics)
      .addAnonymousEventLog(mockNetworkManager.safetyModule, log2.data, ...log2.topics)
      .addAnonymousEventLog(mockNetworkManager.liquidityModule, log3.data, ...log3.topics)
      .addAnonymousEventLog(mockNetworkManager.liquidityModule, log4.data, ...log4.topics);

    const findings = await handler(txEvent);
    expect(findings).toStrictEqual([
      createFinding("Safety Module", TEST_DATA[1]),
      createFinding("Liquidity Module", TEST_DATA[0]),
    ]);
  });
});
