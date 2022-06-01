import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests.utils";
import { MockEthersProvider } from "forta-agent-tools/lib/mock.utils";
import { BigNumber, utils } from "ethers";
import { provideHandleTransaction } from "./agent";
import NetworkData from "./network";
import BalanceFetcher from "./balance.fetcher";
import { MODULE_IFACE } from "./utils";
import { BotConfig } from "./config";
import { DYDX_IFACE } from "./utils";

describe("Large DYDX Deposti/Withdrawal test suite", () => {
  const testStaker: string = createAddress("0xac");
  const testUnderlyingAmounts: BigNumber[] = [
    BigNumber.from("50000000000000000000"), // 50 DYDX, high amount
    BigNumber.from("10000000000000000000"), // 10 DYDX, low amount
    BigNumber.from("70000000000000000000"), // 70 DYDX, high amount
    BigNumber.from("15000000000000000000"), // 15 DYDX, low amount
    BigNumber.from("90000000000000000000"), // 90 DYDX, high amount
    BigNumber.from("95000000000000000000"), // 95 DYDX, high amount
    BigNumber.from("98000000000000000000"), // 98 DYDX, high amount
  ];
  const testStakeAmounts: BigNumber[] = [
    BigNumber.from("1000000000000000000"), // 1 DYDX
    BigNumber.from("2000000000000000000"), // 2 DYDX
    BigNumber.from("3000000000000000000"), // 3 DYDX
    BigNumber.from("4000000000000000000"), // 4 DYDX
    BigNumber.from("5000000000000000000"), // 5 DYDX
    BigNumber.from("6000000000000000000"), // 6 DYDX
    BigNumber.from("7000000000000000000"), // 7 DYDX
  ];

  const mockProvider = new MockEthersProvider();
  const mockNetworkManager: NetworkData = {
    safetyModule: createAddress("0xab"),
    dydxAddress: createAddress("0xad"),
    networkMap: {},
    setNetwork: jest.fn(),
  };
  const mockBalanceFetcher = new BalanceFetcher(mockProvider as any, mockNetworkManager as any);

  describe("STATIC mode", () => {
    const testStaticConfig: BotConfig = {
      mode: "STATIC",
      thresholdData: BigNumber.from("20000000000000000000"), // 20 DYDX
    };

    const handleTransaction: HandleTransaction = provideHandleTransaction(
      testStaticConfig,
      mockNetworkManager,
      mockBalanceFetcher
    );

    it("should return 0 findings in empty transactions", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent();

      const findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("should detect a large DYDX Staked event", async () => {
      const testSpender: string = createAddress("0x1");

      const StakedLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("Staked"), [
        testStaker,
        testSpender,
        testUnderlyingAmounts[0],
        testStakeAmounts[0],
      ]);

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setTo(mockNetworkManager.safetyModule)
        .setFrom(testStaker)
        .addAnonymousEventLog(mockNetworkManager.safetyModule, StakedLog.data, ...StakedLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Large DYDX stake on Safety Module contract",
          description: "Staked event was emitted in Safety Module contract with a large amount",
          alertId: "DYDX-11-1",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "dYdX",
          metadata: {
            staker: testStaker,
            spender: testSpender,
            underlyingAmount: testUnderlyingAmounts[0].toString(),
            stakeAmount: testStakeAmounts[0].toString(),
          },
        }),
      ]);
    });

    it("should not detect a non-large Staked event", async () => {
      const testSpender: string = createAddress("0x2");

      const StakedLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("Staked"), [
        testStaker,
        testSpender,
        testUnderlyingAmounts[1],
        testStakeAmounts[1],
      ]);

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setTo(mockNetworkManager.safetyModule)
        .setFrom(testStaker)
        .addAnonymousEventLog(mockNetworkManager.safetyModule, StakedLog.data, ...StakedLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("should detect a large WithdrewStake event", async () => {
      const testRecipient: string = createAddress("0x3");

      const WithdrewStakeLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("WithdrewStake"), [
        testStaker,
        testRecipient,
        testUnderlyingAmounts[2],
        testStakeAmounts[2],
      ]);

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setTo(mockNetworkManager.safetyModule)
        .setFrom(testStaker)
        .addAnonymousEventLog(mockNetworkManager.safetyModule, WithdrewStakeLog.data, ...WithdrewStakeLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Large DYDX stake withdrawal from Safety Module contract",
          description: "WithdrewStake event was emitted in Safety Module contract with a large amount",
          alertId: "DYDX-11-2",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "dYdX",
          metadata: {
            staker: testStaker,
            recipient: testRecipient,
            underlyingAmount: testUnderlyingAmounts[2].toString(),
            stakeAmount: testStakeAmounts[2].toString(),
          },
        }),
      ]);
    });

    it("should not detect a non-large WithdrewStake event", async () => {
      const testRecipient: string = createAddress("0x4");

      const WithdrewStakeLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("WithdrewStake"), [
        testStaker,
        testRecipient,
        testUnderlyingAmounts[3],
        testStakeAmounts[3],
      ]);

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setTo(mockNetworkManager.safetyModule)
        .setFrom(testStaker)
        .addAnonymousEventLog(mockNetworkManager.safetyModule, WithdrewStakeLog.data, ...WithdrewStakeLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("should detect both a large Staked event and large WithdrewStake event", async () => {
      const testSpender: string = createAddress("0x7");
      const testRecipient: string = createAddress("0x8");

      const StakedLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("Staked"), [
        testStaker,
        testSpender,
        testUnderlyingAmounts[4],
        testStakeAmounts[4],
      ]);

      const WithdrewStakeLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("WithdrewStake"), [
        testStaker,
        testRecipient,
        testUnderlyingAmounts[5],
        testStakeAmounts[5],
      ]);

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setTo(mockNetworkManager.safetyModule)
        .setFrom(testStaker)
        .addAnonymousEventLog(mockNetworkManager.safetyModule, StakedLog.data, ...StakedLog.topics)
        .addAnonymousEventLog(mockNetworkManager.safetyModule, WithdrewStakeLog.data, ...WithdrewStakeLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Large DYDX stake on Safety Module contract",
          description: "Staked event was emitted in Safety Module contract with a large amount",
          alertId: "DYDX-11-1",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "dYdX",
          metadata: {
            staker: testStaker,
            spender: testSpender,
            underlyingAmount: testUnderlyingAmounts[4].toString(),
            stakeAmount: testStakeAmounts[4].toString(),
          },
        }),
        Finding.fromObject({
          name: "Large DYDX stake withdrawal from Safety Module contract",
          description: "WithdrewStake event was emitted in Safety Module contract with a large amount",
          alertId: "DYDX-11-2",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "dYdX",
          metadata: {
            staker: testStaker.toLowerCase(),
            recipient: testRecipient.toLowerCase(),
            underlyingAmount: testUnderlyingAmounts[5].toString(),
            stakeAmount: testStakeAmounts[5].toString(),
          },
        }),
      ]);
    });

    it("should not detect an incorrect event", async () => {
      const wrongIFace = new utils.Interface(["event WrongEvent()"]);
      const wrongLog = wrongIFace.encodeEventLog(wrongIFace.getEvent("WrongEvent"), []);

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setTo(mockNetworkManager.safetyModule)
        .setFrom(testStaker)
        .addAnonymousEventLog(mockNetworkManager.safetyModule, wrongLog.data, ...wrongLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("should not detect an event emission from the wrong contract", async () => {
      const wrongModuleAddress: string = createAddress("0xd34d");
      const testSpender: string = createAddress("0x11");

      const StakedLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("Staked"), [
        testStaker,
        testSpender,
        testUnderlyingAmounts[6],
        testStakeAmounts[6],
      ]);

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setTo(mockNetworkManager.safetyModule)
        .setFrom(testStaker)
        .addAnonymousEventLog(wrongModuleAddress, StakedLog.data, ...StakedLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });
  });

  describe("PERCENTAGE mode", () => {
    const testBlockNumbers: number[] = [11, 22, 33, 444, 5555, 6666];
    const testStakedTokenAmounts: BigNumber[] = [
      BigNumber.from("100000000000000000000"), // 100 DYDX
      BigNumber.from("200000000000000000000"), // 200 DYDX
      BigNumber.from("300000000000000000000"), // 300 DYDX
      BigNumber.from("400000000000000000000"), // 400 DYDX
      BigNumber.from("500000000000000000000"), // 500 DYDX
      BigNumber.from("600000000000000000000"), // 600 DYDX
    ];

    const createBalanceOfCall = (moduleAddress: string, tokenAmount: BigNumber, blockNumber: number) => {
      mockProvider.addCallTo(mockNetworkManager.dydxAddress, blockNumber, DYDX_IFACE, "balanceOf", {
        inputs: [moduleAddress],
        outputs: [tokenAmount],
      });
    };

    const testDynamicConfig: BotConfig = {
      mode: "PERCENTAGE",
      thresholdData: BigNumber.from(10), // 10% threshold
    };

    const handleTransaction: HandleTransaction = provideHandleTransaction(
      testDynamicConfig,
      mockNetworkManager,
      mockBalanceFetcher
    );

    it("should return 0 findings in empty transactions", async () => {
      const txEvent: TransactionEvent = new TestTransactionEvent();

      const findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("should detect a large DYDX Staked event", async () => {
      createBalanceOfCall(mockNetworkManager.safetyModule, testStakedTokenAmounts[0], testBlockNumbers[0] - 1);
      const testSpender: string = createAddress("0x1");

      const StakedLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("Staked"), [
        testStaker,
        testSpender,
        testUnderlyingAmounts[0],
        testStakeAmounts[0],
      ]);

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setTo(mockNetworkManager.safetyModule)
        .setFrom(testStaker)
        .setBlock(testBlockNumbers[0])
        .addAnonymousEventLog(mockNetworkManager.safetyModule, StakedLog.data, ...StakedLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Large DYDX stake on Safety Module contract",
          description: "Staked event was emitted in Safety Module contract with a large amount",
          alertId: "DYDX-11-1",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "dYdX",
          metadata: {
            staker: testStaker,
            spender: testSpender,
            underlyingAmount: testUnderlyingAmounts[0].toString(),
            stakeAmount: testStakeAmounts[0].toString(),
          },
        }),
      ]);
    });

    it("should not detect a non-large Staked event", async () => {
      createBalanceOfCall(mockNetworkManager.safetyModule, testStakedTokenAmounts[1], testBlockNumbers[1] - 1);
      const testSpender: string = createAddress("0x2");

      const StakedLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("Staked"), [
        testStaker,
        testSpender,
        testUnderlyingAmounts[1],
        testStakeAmounts[1],
      ]);

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setTo(mockNetworkManager.safetyModule)
        .setFrom(testStaker)
        .setBlock(testBlockNumbers[1])
        .addAnonymousEventLog(mockNetworkManager.safetyModule, StakedLog.data, ...StakedLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("should detect a large WithdrewStake event", async () => {
      createBalanceOfCall(mockNetworkManager.safetyModule, testStakedTokenAmounts[2], testBlockNumbers[2] - 1);
      const testRecipient: string = createAddress("0x3");

      const WithdrewStakeLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("WithdrewStake"), [
        testStaker,
        testRecipient,
        testUnderlyingAmounts[2],
        testStakeAmounts[2],
      ]);

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setTo(mockNetworkManager.safetyModule)
        .setFrom(testStaker)
        .setBlock(testBlockNumbers[2])
        .addAnonymousEventLog(mockNetworkManager.safetyModule, WithdrewStakeLog.data, ...WithdrewStakeLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Large DYDX stake withdrawal from Safety Module contract",
          description: "WithdrewStake event was emitted in Safety Module contract with a large amount",
          alertId: "DYDX-11-2",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "dYdX",
          metadata: {
            staker: testStaker,
            recipient: testRecipient,
            underlyingAmount: testUnderlyingAmounts[2].toString(),
            stakeAmount: testStakeAmounts[2].toString(),
          },
        }),
      ]);
    });

    it("should not detect a non-large WithdrewStake event", async () => {
      createBalanceOfCall(mockNetworkManager.safetyModule, testStakedTokenAmounts[3], testBlockNumbers[3] - 1);
      const testRecipient: string = createAddress("0x4");

      const WithdrewStakeLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("WithdrewStake"), [
        testStaker,
        testRecipient,
        testUnderlyingAmounts[3],
        testStakeAmounts[3],
      ]);

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setTo(mockNetworkManager.safetyModule)
        .setFrom(testStaker)
        .setBlock(testBlockNumbers[3])
        .addAnonymousEventLog(mockNetworkManager.safetyModule, WithdrewStakeLog.data, ...WithdrewStakeLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("should detect both a large Staked event and large WithdrewStake event", async () => {
      createBalanceOfCall(mockNetworkManager.safetyModule, testStakedTokenAmounts[4], testBlockNumbers[4] - 1);
      const testSpender: string = createAddress("0x7");
      const testRecipient: string = createAddress("0x8");

      const StakedLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("Staked"), [
        testStaker,
        testSpender,
        testUnderlyingAmounts[4],
        testStakeAmounts[4],
      ]);

      const WithdrewStakeLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("WithdrewStake"), [
        testStaker,
        testRecipient,
        testUnderlyingAmounts[5],
        testStakeAmounts[5],
      ]);

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setTo(mockNetworkManager.safetyModule)
        .setFrom(testStaker)
        .setBlock(testBlockNumbers[3])
        .addAnonymousEventLog(mockNetworkManager.safetyModule, StakedLog.data, ...StakedLog.topics)
        .addAnonymousEventLog(mockNetworkManager.safetyModule, WithdrewStakeLog.data, ...WithdrewStakeLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Large DYDX stake on Safety Module contract",
          description: "Staked event was emitted in Safety Module contract with a large amount",
          alertId: "DYDX-11-1",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "dYdX",
          metadata: {
            staker: testStaker,
            spender: testSpender,
            underlyingAmount: testUnderlyingAmounts[4].toString(),
            stakeAmount: testStakeAmounts[4].toString(),
          },
        }),
        Finding.fromObject({
          name: "Large DYDX stake withdrawal from Safety Module contract",
          description: "WithdrewStake event was emitted in Safety Module contract with a large amount",
          alertId: "DYDX-11-2",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "dYdX",
          metadata: {
            staker: testStaker.toLowerCase(),
            recipient: testRecipient.toLowerCase(),
            underlyingAmount: testUnderlyingAmounts[5].toString(),
            stakeAmount: testStakeAmounts[5].toString(),
          },
        }),
      ]);
    });

    it("should not detect an incorrect event", async () => {
      const wrongIFace = new utils.Interface(["event WrongEvent()"]);
      const wrongLog = wrongIFace.encodeEventLog(wrongIFace.getEvent("WrongEvent"), []);

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setTo(mockNetworkManager.safetyModule)
        .setFrom(testStaker)
        .setBlock(testBlockNumbers[4])
        .addAnonymousEventLog(mockNetworkManager.safetyModule, wrongLog.data, ...wrongLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("should not detect an event emission from the wrong contract", async () => {
      createBalanceOfCall(mockNetworkManager.safetyModule, testStakedTokenAmounts[5], testBlockNumbers[5] - 1);
      const wrongModuleAddress: string = createAddress("0xd34d");
      const testSpender: string = createAddress("0x11");

      const StakedLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("Staked"), [
        testStaker,
        testSpender,
        testUnderlyingAmounts[6],
        testStakeAmounts[6],
      ]);

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setTo(mockNetworkManager.safetyModule)
        .setFrom(testStaker)
        .setBlock(testBlockNumbers[5])
        .addAnonymousEventLog(wrongModuleAddress, StakedLog.data, ...StakedLog.topics);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });
  });
});
