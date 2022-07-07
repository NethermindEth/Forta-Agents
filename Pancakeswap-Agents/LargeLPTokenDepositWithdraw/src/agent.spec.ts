import { FindingType, FindingSeverity, Finding, HandleTransaction } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/tests.utils";
import { MockEthersProvider, createAddress } from "forta-agent-tools/lib/tests";

import { BigNumber, ethers } from "ethers";
import { provideHandleTransaction } from "./agent";
import { MASTERCHEF_ABI, MASTERCHEF_ADDRESS, IBEP20_ABI } from "./constants";
import { BotConfig } from "./config";

const MASTERCHEF_INTERFACE = new ethers.utils.Interface(MASTERCHEF_ABI);
const IBEP20_INTERFACE = new ethers.utils.Interface(IBEP20_ABI);

// Function to set the token address of a certain token in the masterchef account
function addLPTokenAddress(mockProvider: MockEthersProvider, pid: number, tokenAddress: string, block: number) {
  mockProvider.addCallTo(MASTERCHEF_ADDRESS, block, MASTERCHEF_INTERFACE, "lpToken", {
    inputs: [pid],
    outputs: [tokenAddress],
  });
}

// Function to set the name balance of masterchef account at a certain tokenAddress
function addLPTokenNameBalance(
  mockProvider: MockEthersProvider,
  tokenAddress: string,
  tokenName: string,
  balance: ethers.BigNumber,
  block: number
) {
  mockProvider.addCallTo(tokenAddress, block - 1, IBEP20_INTERFACE, "balanceOf", {
    inputs: [MASTERCHEF_ADDRESS],
    outputs: [balance],
  });
  mockProvider.addCallTo(tokenAddress, block, IBEP20_INTERFACE, "name", { inputs: [], outputs: [tokenName] });
}

describe("Large Pancakeswap LP Token Deposit/Withdraw test suite", () => {
  // Static mode
  describe("STATIC mode", () => {
    let handleTransaction: HandleTransaction;
    let mockProvider: MockEthersProvider;
    let provider: ethers.providers.Provider;

    const testStaticConfig: BotConfig = {
      mode: "STATIC",
      thresholdData: BigNumber.from("1000000000000000000"), // 1
    };

    beforeEach(() => {
      mockProvider = new MockEthersProvider();
      provider = mockProvider as any;
    });

    it("Should return 0 findings in empty transactions", async () => {
      handleTransaction = provideHandleTransaction(testStaticConfig, provider, MASTERCHEF_ADDRESS);
      const txEvent: TestTransactionEvent = new TestTransactionEvent();
      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Should detect a large deposit event", async () => {
      const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(100);
      handleTransaction = provideHandleTransaction(testStaticConfig, provider, MASTERCHEF_ADDRESS);

      // Add Deposit event
      const testSpender: string = createAddress("0x1");
      const depositLog = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Deposit"), [
        testSpender,
        10,
        BigNumber.from("2000000000000000000"), // 2
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(MASTERCHEF_ADDRESS, depositLog.data, ...depositLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, 10, mockTokenAddress, 100);
      // Add balance to the token contract (token address above) (balance of 2)
      addLPTokenNameBalance(
        mockProvider,
        mockTokenAddress,
        "Test Token 1",
        ethers.BigNumber.from("2000000000000000000"),
        100
      );

      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Large LP Token Deposit",
          description: `Deposit event emitted in Masterchef contract for pool 10, Test Token 1 token with a large amount`,
          alertId: "CAKE-4-1",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "PancakeSwap",
          metadata: {
            user: testSpender,
            token: "Test Token 1",
            pid: "10",
            amount: "2000000000000000000",
          },
        }),
      ]);
    });

    it("Should ignore a deposit event under the threshold", async () => {
      const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(100);
      handleTransaction = provideHandleTransaction(testStaticConfig, provider, MASTERCHEF_ADDRESS);

      // Add Deposit event
      const testSpender: string = createAddress("0x1");
      const depositLog = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Deposit"), [
        testSpender,
        10,
        BigNumber.from("900000000000000000"), // 0.9
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(MASTERCHEF_ADDRESS, depositLog.data, ...depositLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, 10, mockTokenAddress, 100);
      // Add balance to the token contract (token address above) (balance of 2)
      addLPTokenNameBalance(
        mockProvider,
        mockTokenAddress,
        "Test Token 1",
        ethers.BigNumber.from("2000000000000000000"),
        100
      );

      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Should detect a large withdraw event", async () => {
      const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(100);
      handleTransaction = provideHandleTransaction(testStaticConfig, provider, MASTERCHEF_ADDRESS);

      // Add Withdraw event
      const testSpender: string = createAddress("0x9");
      const withdrawLog = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Withdraw"), [
        testSpender,
        20,
        BigNumber.from("3000000000000000000"), // 3
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(MASTERCHEF_ADDRESS, withdrawLog.data, ...withdrawLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, 20, mockTokenAddress, 100);
      // Add balance to the token contract (token address above) (balance of 2)
      addLPTokenNameBalance(
        mockProvider,
        mockTokenAddress,
        "Test Token 2",
        ethers.BigNumber.from("5000000000000000000"),
        100
      );

      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Large LP Token Withdraw",
          description: `Withdraw event emitted in Masterchef contract for pool 20, Test Token 2 token with a large amount`,
          alertId: "CAKE-4-2",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "PancakeSwap",
          metadata: {
            user: testSpender,
            token: "Test Token 2",
            pid: "20",
            amount: "3000000000000000000",
          },
        }),
      ]);
    });

    it("Should ignore a withdraw event under the threshold", async () => {
      const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(100);
      handleTransaction = provideHandleTransaction(testStaticConfig, provider, MASTERCHEF_ADDRESS);

      // Add Withdraw event
      const testSpender: string = createAddress("0x9");
      const withdrawLog = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Withdraw"), [
        testSpender,
        20,
        BigNumber.from("500000000000000000"), // 0.5
      ]);
      // Create test transaction with the withdraw event
      txEvent.addAnonymousEventLog(MASTERCHEF_ADDRESS, withdrawLog.data, ...withdrawLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, 20, mockTokenAddress, 100);
      // Add balance to the token contract (token address above) (balance of 2)
      addLPTokenNameBalance(
        mockProvider,
        mockTokenAddress,
        "Test Token 2",
        ethers.BigNumber.from("5000000000000000000"),
        100
      );

      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Should detect a large EmergencyWithdraw event", async () => {
      const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(100);
      handleTransaction = provideHandleTransaction(testStaticConfig, provider, MASTERCHEF_ADDRESS);

      // Add EmergencyWithdraw event
      const testSpender: string = createAddress("0x9");
      const withdrawLog = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("EmergencyWithdraw"), [
        testSpender,
        20,
        BigNumber.from("3000000000000000000"), // 3
      ]);
      // Create test transaction with the EmegencyWithdraw event
      txEvent.addAnonymousEventLog(MASTERCHEF_ADDRESS, withdrawLog.data, ...withdrawLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, 20, mockTokenAddress, 100);
      // Add balance to the token contract (token address above) (balance of 2)
      addLPTokenNameBalance(
        mockProvider,
        mockTokenAddress,
        "Test Token 2",
        ethers.BigNumber.from("5000000000000000000"),
        100
      );

      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Large LP Token EmergencyWithdraw",
          description: `EmergencyWithdraw event emitted in Masterchef contract for pool 20, Test Token 2 token with a large amount`,
          alertId: "CAKE-4-3",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "PancakeSwap",
          metadata: {
            user: testSpender,
            token: "Test Token 2",
            pid: "20",
            amount: "3000000000000000000",
          },
        }),
      ]);
    });

    it("Should ignore a EmergencyWithdraw event under the threshold", async () => {
      const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(100);
      handleTransaction = provideHandleTransaction(testStaticConfig, provider, MASTERCHEF_ADDRESS);

      // Add EmergencyWithdraw event
      const testSpender: string = createAddress("0x9");
      const withdrawLog = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("EmergencyWithdraw"), [
        testSpender,
        20,
        BigNumber.from("500000000000000000"), // 0.5
      ]);
      // Create test transaction with the EmergencyWithdraw event
      txEvent.addAnonymousEventLog(MASTERCHEF_ADDRESS, withdrawLog.data, ...withdrawLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, 20, mockTokenAddress, 100);
      // Add balance to the token contract (token address above) (balance of 2)
      addLPTokenNameBalance(
        mockProvider,
        mockTokenAddress,
        "Test Token 2",
        ethers.BigNumber.from("5000000000000000000"),
        100
      );

      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });
  });

  // Percentage mode
  describe("PERCENTAGE mode", () => {
    let handleTransaction: HandleTransaction;
    let mockProvider: MockEthersProvider;
    let provider: ethers.providers.Provider;

    const testDynamicConfig: BotConfig = {
      mode: "PERCENTAGE",
      thresholdData: BigNumber.from(50), // 50%
    };

    beforeEach(() => {
      mockProvider = new MockEthersProvider();
      provider = mockProvider as any;
    });

    it("Should return 0 findings in empty transactions", async () => {
      handleTransaction = provideHandleTransaction(testDynamicConfig, provider, MASTERCHEF_ADDRESS);
      const txEvent: TestTransactionEvent = new TestTransactionEvent();
      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Should detect a large deposit event", async () => {
      const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(100);
      handleTransaction = provideHandleTransaction(testDynamicConfig, provider, MASTERCHEF_ADDRESS);

      // Add Deposit event
      const testSpender: string = createAddress("0x1");
      const depositLog = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Deposit"), [
        testSpender,
        10,
        BigNumber.from("2100000000000000000"), // 2.1
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(MASTERCHEF_ADDRESS, depositLog.data, ...depositLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, 10, mockTokenAddress, 100);
      // Add balance to the token contract (token address above) (balance of 4)
      addLPTokenNameBalance(
        mockProvider,
        mockTokenAddress,
        "Test Token 1",
        ethers.BigNumber.from("4000000000000000000"),
        100
      );

      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Large LP Token Deposit",
          description: `Deposit event emitted in Masterchef contract for pool 10, Test Token 1 token with a large amount`,
          alertId: "CAKE-4-1",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "PancakeSwap",
          metadata: {
            user: testSpender,
            token: "Test Token 1",
            pid: "10",
            amount: "2100000000000000000",
          },
        }),
      ]);
    });

    it("Should detect multiple large deposit events", async () => {
      const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(100);
      handleTransaction = provideHandleTransaction(testDynamicConfig, provider, MASTERCHEF_ADDRESS);

      // Add Deposit event 1
      const testSpender1: string = createAddress("0x1");
      const depositLog1 = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Deposit"), [
        testSpender1,
        10,
        BigNumber.from("2100000000000000000"), // 2.1
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(MASTERCHEF_ADDRESS, depositLog1.data, ...depositLog1.topics);

      // Add Deposit event 2
      const testSpender2: string = createAddress("0x2");
      const depositLog2 = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Deposit"), [
        testSpender2,
        20,
        BigNumber.from("2100000000000000000"), // 2.1
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(MASTERCHEF_ADDRESS, depositLog2.data, ...depositLog2.topics);

      // Add first token address to Masterchef contract
      const mockTokenAddress1: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, 10, mockTokenAddress1, 100);
      // Add balance to the token contract (token address above) (balance of 4)
      addLPTokenNameBalance(
        mockProvider,
        mockTokenAddress1,
        "Test Token 1",
        ethers.BigNumber.from("4000000000000000000"),
        100
      );

      // Add second token address to Masterchef contract
      const mockTokenAddress2: string = createAddress("0x5678");
      addLPTokenAddress(mockProvider, 20, mockTokenAddress2, 100);
      // Add balance to the token contract (token address above) (balance of 4)
      addLPTokenNameBalance(
        mockProvider,
        mockTokenAddress2,
        "Test Token 2",
        ethers.BigNumber.from("4000000000000000000"),
        100
      );

      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Large LP Token Deposit",
          description: `Deposit event emitted in Masterchef contract for pool 10, Test Token 1 token with a large amount`,
          alertId: "CAKE-4-1",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "PancakeSwap",
          metadata: {
            user: testSpender1,
            token: "Test Token 1",
            pid: "10",
            amount: "2100000000000000000",
          },
        }),
        Finding.fromObject({
          name: "Large LP Token Deposit",
          description: `Deposit event emitted in Masterchef contract for pool 20, Test Token 2 token with a large amount`,
          alertId: "CAKE-4-1",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "PancakeSwap",
          metadata: {
            user: testSpender2,
            token: "Test Token 2",
            pid: "20",
            amount: "2100000000000000000",
          },
        }),
      ]);
    });

    it("Should ignore a deposit event under the threshold", async () => {
      const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(100);
      handleTransaction = provideHandleTransaction(testDynamicConfig, provider, MASTERCHEF_ADDRESS);

      // Add Deposit event
      const testSpender: string = createAddress("0x1");
      const depositLog = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Deposit"), [
        testSpender,
        10,
        BigNumber.from("2100000000000000000"), // 2.1
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(MASTERCHEF_ADDRESS, depositLog.data, ...depositLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, 10, mockTokenAddress, 100);
      // Add balance to the token contract (token address above) (balance of 5)
      addLPTokenNameBalance(
        mockProvider,
        mockTokenAddress,
        "Test Token 1",
        ethers.BigNumber.from("5000000000000000000"),
        100
      );

      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Should detect a large withdraw event", async () => {
      const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(100);
      handleTransaction = provideHandleTransaction(testDynamicConfig, provider, MASTERCHEF_ADDRESS);

      // Add Withdraw event
      const testSpender: string = createAddress("0x9");
      const withdrawLog = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Withdraw"), [
        testSpender,
        20,
        BigNumber.from("3000000000000000000"), // 3
      ]);
      // Create test transaction with the withdraw event
      txEvent.addAnonymousEventLog(MASTERCHEF_ADDRESS, withdrawLog.data, ...withdrawLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, 20, mockTokenAddress, 100);
      // Add balance to the token contract (token address above) (balance of 5)
      addLPTokenNameBalance(
        mockProvider,
        mockTokenAddress,
        "Test Token 2",
        ethers.BigNumber.from("5000000000000000000"),
        100
      );

      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Large LP Token Withdraw",
          description: `Withdraw event emitted in Masterchef contract for pool 20, Test Token 2 token with a large amount`,
          alertId: "CAKE-4-2",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "PancakeSwap",
          metadata: {
            user: testSpender,
            token: "Test Token 2",
            pid: "20",
            amount: "3000000000000000000",
          },
        }),
      ]);
    });

    it("Should ignore a withdraw event under the threshold", async () => {
      const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(100);
      handleTransaction = provideHandleTransaction(testDynamicConfig, provider, MASTERCHEF_ADDRESS);

      // Add Withdraw event
      const testSpender: string = createAddress("0x9");
      const withdrawLog = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Withdraw"), [
        testSpender,
        20,
        BigNumber.from("2400000000000000000"), // 2.4
      ]);
      // Create test transaction with the withdraw event
      txEvent.addAnonymousEventLog(MASTERCHEF_ADDRESS, withdrawLog.data, ...withdrawLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, 20, mockTokenAddress, 100);
      // Add balance to the token contract (token address above) (balance of 5)
      addLPTokenNameBalance(
        mockProvider,
        mockTokenAddress,
        "Test Token 2",
        ethers.BigNumber.from("5000000000000000000"),
        100
      );

      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });
  });
});
