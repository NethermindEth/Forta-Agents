import { BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { MockEthersProvider } from "forta-agent-tools/lib/mock.utils";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests.utils";
import { provideHandleTransaction } from "./agent";
import BalanceFetcher from "./balance.fetcher";
import { BotConfig } from "./config";
import InactiveBalanceFetcher from "./inactive.balance.fetcher";
import { BALANCE_ABI, EVENT_SIGNATURE, INACTIVE_BALANCE_ABI } from "./utils";

describe("Large Inactive Balance tests suite", () => {
  const EVENT_IFACE = new Interface(EVENT_SIGNATURE);
  const mockProvider = new MockEthersProvider();

  const mockNetworkManager = {
    dydxAddress: createAddress("0xa1"),
    safetyModule: createAddress("0xa2"),
  };
  const mockBalanceFetcher = new BalanceFetcher(mockProvider as any, mockNetworkManager as any);
  const mockInactiveBalanceFetcher = new InactiveBalanceFetcher(mockProvider as any, mockNetworkManager as any);

  const createInactiveBalanceCall = (
    moduleAddress: string,
    staker: string,
    inactiveBalance: BigNumber,
    blockNumber: number
  ) => {
    mockProvider.addCallTo(moduleAddress, blockNumber, INACTIVE_BALANCE_ABI, "getInactiveBalanceNextEpoch", {
      inputs: [staker],
      outputs: [inactiveBalance],
    });
  };
  const createBalanceOfcall = (tokenAddress: string, safetyModule: string, balance: BigNumber, blockNumber: number) => {
    mockProvider.addCallTo(tokenAddress, blockNumber, BALANCE_ABI, "balanceOf", {
      inputs: [safetyModule],
      outputs: [balance],
    });
  };

  const createFinding = (mode: string, staker: string, inactiveBalance: BigNumber) => {
    return Finding.fromObject({
      name: "Large inactive balance on Safety module",
      description: "Staker with large inactive balance on safety module is detected",
      alertId: "DYDX-13",
      protocol: "dYdX",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        mode: mode,
        staker: staker.toLowerCase(),
        inactiveBalance: inactiveBalance.toString(),
      },
    });
  };

  describe("STATIC mode", () => {
    // <staker, inactive balance>
    const TEST_DATA: [string, BigNumber][] = [
      [createAddress("0xb1"), BigNumber.from(50)], // below threshold
      [createAddress("0xb2"), BigNumber.from(90)], // below threshold
      [createAddress("0xb3"), BigNumber.from(150)], // above threshold
      [createAddress("0xb4"), BigNumber.from(200)], // above threshold
    ];
    const TEST_BLOCKS = [10, 20, 30, 40];

    let handler: HandleTransaction;

    beforeAll(() => {
      const CONFIG: BotConfig = {
        mode: "STATIC",
        thresholdData: BigNumber.from(100),
      };

      handler = provideHandleTransaction(
        CONFIG,
        mockNetworkManager as any,
        mockInactiveBalanceFetcher,
        mockBalanceFetcher
      );
    });
    beforeEach(() => {
      mockProvider.clear();
    });

    it("returns empty findings for transactions with no events", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent();

      const findings = await handler(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("ignores events on different contract", async () => {
      createInactiveBalanceCall(
        mockNetworkManager.safetyModule,
        TEST_DATA[2][0], //staker
        TEST_DATA[2][1], // inactive balance above threshold
        TEST_BLOCKS[0] // block number
      );

      const log = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("WithdrawalRequested"), [
        TEST_DATA[2][0],
        BigNumber.from(20),
      ]);

      const txEvent: TransactionEvent = new TestTransactionEvent().setBlock(TEST_BLOCKS[0]).addAnonymousEventLog(
        createAddress("0xb3"), // different contract
        log.data,
        ...log.topics
      );

      const findings = await handler(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("return a finding when inactive balance exceeds the threshold", async () => {
      createInactiveBalanceCall(
        mockNetworkManager.safetyModule,
        TEST_DATA[2][0], //staker
        TEST_DATA[2][1], // inactive balance above threshold
        TEST_BLOCKS[1] // block number
      );

      const log = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("WithdrawalRequested"), [
        TEST_DATA[2][0],
        BigNumber.from(20),
      ]);

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setBlock(TEST_BLOCKS[1])
        .addAnonymousEventLog(mockNetworkManager.safetyModule, log.data, ...log.topics);

      const findings = await handler(txEvent);
      expect(findings).toStrictEqual([createFinding("STATIC", TEST_DATA[2][0], TEST_DATA[2][1])]);
    });

    it("return no finding when inactive balance is below the threshold", async () => {
      createInactiveBalanceCall(
        mockNetworkManager.safetyModule,
        TEST_DATA[0][0], //staker
        TEST_DATA[0][1], // inactive balance below threshold
        TEST_BLOCKS[2] // block number
      );

      const log = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("WithdrawalRequested"), [
        TEST_DATA[0][0],
        BigNumber.from(20),
      ]);

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setBlock(TEST_BLOCKS[2])
        .addAnonymousEventLog(mockNetworkManager.safetyModule, log.data, ...log.topics);

      const findings = await handler(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("return multipe findings when the inactive balance exceeds the threshold", async () => {
      for (let i = 0; i < TEST_DATA.length; i++) {
        createInactiveBalanceCall(
          mockNetworkManager.safetyModule,
          TEST_DATA[i][0], //staker
          TEST_DATA[i][1], // inactive balance
          TEST_BLOCKS[3] // block number
        );
      }

      const log1 = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("WithdrawalRequested"), [
        TEST_DATA[0][0],
        BigNumber.from(20),
      ]);
      const log2 = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("WithdrawalRequested"), [
        TEST_DATA[1][0],
        BigNumber.from(20),
      ]);
      const log3 = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("WithdrawalRequested"), [
        TEST_DATA[2][0],
        BigNumber.from(20),
      ]);
      const log4 = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("WithdrawalRequested"), [
        TEST_DATA[3][0],
        BigNumber.from(20),
      ]);

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setBlock(TEST_BLOCKS[3])
        .addAnonymousEventLog(mockNetworkManager.safetyModule, log1.data, ...log1.topics)
        .addAnonymousEventLog(mockNetworkManager.safetyModule, log2.data, ...log2.topics)
        .addAnonymousEventLog(mockNetworkManager.safetyModule, log3.data, ...log3.topics)
        .addAnonymousEventLog(mockNetworkManager.safetyModule, log4.data, ...log4.topics);

      const findings = await handler(txEvent);
      expect(findings).toStrictEqual([
        createFinding("STATIC", TEST_DATA[2][0], TEST_DATA[2][1]),
        createFinding("STATIC", TEST_DATA[3][0], TEST_DATA[3][1]),
      ]);
    });
  });

  describe("PERCENTAGE mode", () => {
    // <staker, inactive balance, total staked>
    const TEST_DATA: [string, BigNumber, BigNumber][] = [
      [createAddress("0xb1"), BigNumber.from(50), BigNumber.from(1000)], // below threshold
      [createAddress("0xb2"), BigNumber.from(90), BigNumber.from(1000)], // below threshold
      [createAddress("0xb3"), BigNumber.from(150), BigNumber.from(1200)], // above threshold
      [createAddress("0xb4"), BigNumber.from(200), BigNumber.from(1500)], // above threshold
    ];
    const TEST_BLOCKS = [10, 20, 30, 40];

    let handler: HandleTransaction;

    beforeAll(() => {
      const CONFIG: BotConfig = {
        mode: "PERCENTAGE",
        thresholdData: BigNumber.from(10),
      };

      handler = provideHandleTransaction(
        CONFIG,
        mockNetworkManager as any,
        mockInactiveBalanceFetcher,
        mockBalanceFetcher
      );
    });

    it("returns empty findings for transactions with no events", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent();

      const findings = await handler(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("ignores events on different contract", async () => {
      createInactiveBalanceCall(
        mockNetworkManager.safetyModule,
        TEST_DATA[2][0], //staker
        TEST_DATA[2][1], // inactive balance above threshold
        TEST_BLOCKS[0] // block number
      );

      const log = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("WithdrawalRequested"), [
        TEST_DATA[2][0],
        BigNumber.from(20),
      ]);

      const txEvent: TransactionEvent = new TestTransactionEvent().setBlock(TEST_BLOCKS[0]).addAnonymousEventLog(
        createAddress("0xb3"), // different contract
        log.data,
        ...log.topics
      );

      const findings = await handler(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("return a finding when inactive balance exceeds the threshold", async () => {
      createInactiveBalanceCall(
        mockNetworkManager.safetyModule,
        TEST_DATA[2][0], //staker
        TEST_DATA[2][1], // inactive balance above threshold
        TEST_BLOCKS[1] // block number
      );
      createBalanceOfcall(
        mockNetworkManager.dydxAddress,
        mockNetworkManager.safetyModule,
        TEST_DATA[2][2], // balanceOf safetyModule
        TEST_BLOCKS[1] // block number
      );

      const log = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("WithdrawalRequested"), [
        TEST_DATA[2][0],
        BigNumber.from(20),
      ]);

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setBlock(TEST_BLOCKS[1])
        .addAnonymousEventLog(mockNetworkManager.safetyModule, log.data, ...log.topics);

      const findings = await handler(txEvent);
      expect(findings).toStrictEqual([createFinding("PERCENTAGE", TEST_DATA[2][0], TEST_DATA[2][1])]);
    });

    it("return no finding when inactive balance is below the threshold", async () => {
      createInactiveBalanceCall(
        mockNetworkManager.safetyModule,
        TEST_DATA[0][0], //staker
        TEST_DATA[0][1], // inactive balance below threshold
        TEST_BLOCKS[2] // block number
      );
      createBalanceOfcall(
        mockNetworkManager.dydxAddress,
        mockNetworkManager.safetyModule,
        TEST_DATA[0][2], // balanceOf safetyModule
        TEST_BLOCKS[2] // block number
      );

      const log = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("WithdrawalRequested"), [
        TEST_DATA[0][0],
        BigNumber.from(20),
      ]);

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setBlock(TEST_BLOCKS[2])
        .addAnonymousEventLog(mockNetworkManager.safetyModule, log.data, ...log.topics);

      const findings = await handler(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("return multipe findings when the inactive balance exceeds the threshold", async () => {
      for (let i = 0; i < TEST_DATA.length; i++) {
        createInactiveBalanceCall(
          mockNetworkManager.safetyModule,
          TEST_DATA[i][0], //staker
          TEST_DATA[i][1], // inactive balance
          TEST_BLOCKS[3] // block number
        );
        createBalanceOfcall(
          mockNetworkManager.dydxAddress,
          mockNetworkManager.safetyModule,
          TEST_DATA[i][2], // balanceOf safetyModule
          TEST_BLOCKS[3] // block number
        );
      }

      const log1 = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("WithdrawalRequested"), [
        TEST_DATA[0][0],
        BigNumber.from(20),
      ]);
      const log2 = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("WithdrawalRequested"), [
        TEST_DATA[1][0],
        BigNumber.from(20),
      ]);
      const log3 = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("WithdrawalRequested"), [
        TEST_DATA[2][0],
        BigNumber.from(20),
      ]);
      const log4 = EVENT_IFACE.encodeEventLog(EVENT_IFACE.getEvent("WithdrawalRequested"), [
        TEST_DATA[3][0],
        BigNumber.from(20),
      ]);

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setBlock(TEST_BLOCKS[3])
        .addAnonymousEventLog(mockNetworkManager.safetyModule, log1.data, ...log1.topics)
        .addAnonymousEventLog(mockNetworkManager.safetyModule, log2.data, ...log2.topics)
        .addAnonymousEventLog(mockNetworkManager.safetyModule, log3.data, ...log3.topics)
        .addAnonymousEventLog(mockNetworkManager.safetyModule, log4.data, ...log4.topics);

      const findings = await handler(txEvent);
      expect(findings).toStrictEqual([
        createFinding("PERCENTAGE", TEST_DATA[2][0], TEST_DATA[2][1]),
        createFinding("PERCENTAGE", TEST_DATA[3][0], TEST_DATA[3][1]),
      ]);
    });
  });
});
