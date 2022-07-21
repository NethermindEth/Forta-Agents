import { FindingType, FindingSeverity, Finding, HandleTransaction } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/tests.utils";
import { MockEthersProvider, createAddress } from "forta-agent-tools/lib/tests";

import { BigNumber, ethers } from "ethers";
import { provideHandleTransaction } from "./agent";
import { MASTERCHEF_ABI, IBEP20_ABI } from "./constants";
import { BotConfig } from "./config";
import MasterchefFetcher from "./masterchef.fetcher";

const MASTERCHEF_INTERFACE = new ethers.utils.Interface(MASTERCHEF_ABI);
const IBEP20_INTERFACE = new ethers.utils.Interface(IBEP20_ABI);

// Function to set the token address of a certain token in the masterchef account
function addLPTokenAddress(
  mockProvider: MockEthersProvider, 
  mockMasterchefAddress: string,
  pid: number, 
  tokenAddress: string, 
  block: number) {
  mockProvider.addCallTo(mockMasterchefAddress, block, MASTERCHEF_INTERFACE, "lpToken", {
    inputs: [pid],
    outputs: [tokenAddress],
  });
}

// Function to set the name of a token
function addLPTokenName(
  mockProvider: MockEthersProvider,
  tokenAddress: string,
  tokenName: string,
  block: number
) {
  mockProvider.addCallTo(tokenAddress, block, IBEP20_INTERFACE, "name", { inputs: [], outputs: [tokenName] });
}

// Function to set the Masterchef's balance of a certain LP Token
function addLPTokenBalance(
  mockProvider: MockEthersProvider,
  masterchefAddress: string,
  tokenAddress: string,
  balance: BigNumber,
  block: number
) {
  mockProvider.addCallTo(tokenAddress, block - 1, IBEP20_INTERFACE, "balanceOf", {
    inputs: [masterchefAddress],
    outputs: [balance],
  });
}

describe("Large Pancakeswap LP Token Deposit/Withdraw test suite", () => {
  // Static mode
  describe("STATIC mode", () => {
    let handleTransaction: HandleTransaction;
    let mockProvider: MockEthersProvider;
    let provider: ethers.providers.Provider;
    let mockMasterchefFetcher: MasterchefFetcher;

    const mockMasterchefAddress = createAddress("0xad");

    const testStaticConfig: BotConfig = {
      mode: "STATIC",
      thresholdData: BigNumber.from("1000000000000000000"), // 1
    };

    beforeEach(() => {
      mockProvider = new MockEthersProvider();
      provider = mockProvider as any;
      mockMasterchefFetcher = new MasterchefFetcher(mockProvider as any, mockMasterchefAddress);
    });

    it("Should return 0 findings in empty transactions", async () => {
      handleTransaction = provideHandleTransaction(testStaticConfig, provider, mockMasterchefFetcher, mockMasterchefAddress);
      const txEvent: TestTransactionEvent = new TestTransactionEvent();
      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Should detect a large deposit event", async () => {
      const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(100);
      handleTransaction = provideHandleTransaction(testStaticConfig, provider, mockMasterchefFetcher, mockMasterchefAddress);

      // Add Deposit event
      const testSpender: string = createAddress("0x1");
      const depositLog = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Deposit"), [
        testSpender,
        10,
        BigNumber.from("2000000000000000000"), // 2
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(mockMasterchefAddress, depositLog.data, ...depositLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, mockMasterchefAddress, 10, mockTokenAddress, 100);
      // Add name of token
      addLPTokenName(
        mockProvider,
        mockTokenAddress,
        "Test Token 1",
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
      handleTransaction = provideHandleTransaction(testStaticConfig, provider, mockMasterchefFetcher, mockMasterchefAddress);

      // Add Deposit event
      const testSpender: string = createAddress("0x1");
      const depositLog = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Deposit"), [
        testSpender,
        10,
        BigNumber.from("900000000000000000"), // 0.9
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(mockMasterchefAddress, depositLog.data, ...depositLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, mockMasterchefAddress, 10, mockTokenAddress, 100);
      // Add name of token
      addLPTokenName(
        mockProvider,
        mockTokenAddress,
        "Test Token 1",
        100
      );

      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Should detect a large withdraw event", async () => {
      const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(100);
      handleTransaction = provideHandleTransaction(testStaticConfig, provider, mockMasterchefFetcher, mockMasterchefAddress);

      // Add Withdraw event
      const testSpender: string = createAddress("0x9");
      const withdrawLog = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Withdraw"), [
        testSpender,
        20,
        BigNumber.from("3000000000000000000"), // 3
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(mockMasterchefAddress, withdrawLog.data, ...withdrawLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, mockMasterchefAddress, 20, mockTokenAddress, 100);
      // Add name of token
      addLPTokenName(
        mockProvider,
        mockTokenAddress,
        "Test Token 2",
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

    it("Should detect multiple large deposit events but not not a third deposit event under the threshold", async () => {
      const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(100);
      handleTransaction = provideHandleTransaction(testStaticConfig, provider, mockMasterchefFetcher, mockMasterchefAddress);

      // Add Deposit event 1
      const testSpender1: string = createAddress("0x1");
      const depositLog1 = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Deposit"), [
        testSpender1,
        10,
        BigNumber.from("1100000000000000000"), // 1.1
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(mockMasterchefAddress, depositLog1.data, ...depositLog1.topics);

      // Add Deposit event 2
      const testSpender2: string = createAddress("0x2");
      const depositLog2 = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Deposit"), [
        testSpender2,
        20,
        BigNumber.from("1200000000000000000"), // 1.2
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(mockMasterchefAddress, depositLog2.data, ...depositLog2.topics);

      // Add Deposit event 3
      const testSpender3: string = createAddress("0x3");
      const depositLog3 = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Deposit"), [
        testSpender3,
        20,
        BigNumber.from("900000000000000000"), // 0.9
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(mockMasterchefAddress, depositLog3.data, ...depositLog3.topics);

      // Add first token address to Masterchef contract
      const mockTokenAddress1: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, mockMasterchefAddress, 10, mockTokenAddress1, 100);
      addLPTokenName(
        mockProvider,
        mockTokenAddress1,
        "Test Token 1",
        100
      );

      // Add second token address to Masterchef contract
      const mockTokenAddress2: string = createAddress("0x5678");
      addLPTokenAddress(mockProvider, mockMasterchefAddress, 20, mockTokenAddress2, 100);
      addLPTokenName(
        mockProvider,
        mockTokenAddress2,
        "Test Token 2",
        100
      );

      // Add third token address to Masterchef contract
      const mockTokenAddress3: string = createAddress("0x6543");
      addLPTokenAddress(mockProvider, mockMasterchefAddress, 30, mockTokenAddress3, 100);
      addLPTokenName(
        mockProvider,
        mockTokenAddress3,
        "Test Token 3",
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
            amount: "1100000000000000000",
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
            amount: "1200000000000000000",
          },
        }),
      ]);
    });

    it("Should ignore a withdraw event under the threshold", async () => {
      const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(100);
      handleTransaction = provideHandleTransaction(testStaticConfig, provider, mockMasterchefFetcher, mockMasterchefAddress);

      // Add Withdraw event
      const testSpender: string = createAddress("0x9");
      const withdrawLog = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Withdraw"), [
        testSpender,
        20,
        BigNumber.from("500000000000000000"), // 0.5
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(mockMasterchefAddress, withdrawLog.data, ...withdrawLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, mockMasterchefAddress, 20, mockTokenAddress, 100);
      // Add name of token
      addLPTokenName(
        mockProvider,
        mockTokenAddress,
        "Test Token 2",
        100
      );

      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Should detect a large EmergencyWithdraw event", async () => {
      const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(100);
      handleTransaction = provideHandleTransaction(testStaticConfig, provider, mockMasterchefFetcher, mockMasterchefAddress);

      // Add EmergencyWithdraw event
      const testSpender: string = createAddress("0x9");
      const withdrawLog = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("EmergencyWithdraw"), [
        testSpender,
        20,
        BigNumber.from("3000000000000000000"), // 3
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(mockMasterchefAddress, withdrawLog.data, ...withdrawLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, mockMasterchefAddress, 20, mockTokenAddress, 100);
      // Add name of token
      addLPTokenName(
        mockProvider,
        mockTokenAddress,
        "Test Token 2",
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
      handleTransaction = provideHandleTransaction(testStaticConfig, provider, mockMasterchefFetcher, mockMasterchefAddress);

      // Add EmergencyWithdraw event
      const testSpender: string = createAddress("0x9");
      const withdrawLog = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("EmergencyWithdraw"), [
        testSpender,
        20,
        BigNumber.from("500000000000000000"), // 0.5
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(mockMasterchefAddress, withdrawLog.data, ...withdrawLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, mockMasterchefAddress, 20, mockTokenAddress, 100);
      // Add name of token
      addLPTokenName(
        mockProvider,
        mockTokenAddress,
        "Test Token 2",
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
    let mockMasterchefFetcher: MasterchefFetcher;

    const mockMasterchefAddress = createAddress("0xad");

    const testDynamicConfig: BotConfig = {
      mode: "PERCENTAGE",
      thresholdData: BigNumber.from(50), // 50%
    };

    beforeEach(() => {
      mockProvider = new MockEthersProvider();
      provider = mockProvider as any;
      mockMasterchefFetcher = new MasterchefFetcher(mockProvider as any, mockMasterchefAddress);
    });

    it("Should return 0 findings in empty transactions", async () => {
      handleTransaction = provideHandleTransaction(testDynamicConfig, provider, mockMasterchefFetcher, mockMasterchefAddress);
      const txEvent: TestTransactionEvent = new TestTransactionEvent();
      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Should detect a large deposit event", async () => {
      const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(100);
      handleTransaction = provideHandleTransaction(testDynamicConfig, provider, mockMasterchefFetcher, mockMasterchefAddress);

      // Add Deposit event
      const testSpender: string = createAddress("0x1");
      const depositLog = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Deposit"), [
        testSpender,
        10,
        BigNumber.from("2100000000000000000"), // 2.1
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(mockMasterchefAddress, depositLog.data, ...depositLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, mockMasterchefAddress, 10, mockTokenAddress, 100);
      // Add name of token
      addLPTokenName(
        mockProvider,
        mockTokenAddress,
        "Test Token 1",
        100
      );
      // Add balance to the token contract (token address above) (balance of 4)
      addLPTokenBalance(
        mockProvider,
        mockMasterchefAddress,
        mockTokenAddress,
        BigNumber.from("4000000000000000000"),
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

    it("Should detect multiple large deposit events but not not a third deposit event under the threshold", async () => {
      const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(100);
      handleTransaction = provideHandleTransaction(testDynamicConfig, provider, mockMasterchefFetcher, mockMasterchefAddress);

      // Add Deposit event 1
      const testSpender1: string = createAddress("0x1");
      const depositLog1 = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Deposit"), [
        testSpender1,
        10,
        BigNumber.from("2100000000000000000"), // 2.1
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(mockMasterchefAddress, depositLog1.data, ...depositLog1.topics);

      // Add Deposit event 2
      const testSpender2: string = createAddress("0x2");
      const depositLog2 = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Deposit"), [
        testSpender2,
        20,
        BigNumber.from("2100000000000000000"), // 2.1
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(mockMasterchefAddress, depositLog2.data, ...depositLog2.topics);

      // Add Deposit event 3
      const testSpender3: string = createAddress("0x3");
      const depositLog3 = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Deposit"), [
        testSpender3,
        30,
        BigNumber.from("1900000000000000000"), // 1.9
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(mockMasterchefAddress, depositLog3.data, ...depositLog3.topics);

      // Add first token address to Masterchef contract
      const mockTokenAddress1: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, mockMasterchefAddress, 10, mockTokenAddress1, 100);
      // Add name of token
      addLPTokenName(
        mockProvider,
        mockTokenAddress1,
        "Test Token 1",
        100
      );
      // Add balance to the token contract (token address above) (balance of 4)
      addLPTokenBalance(
        mockProvider,
        mockMasterchefAddress,
        mockTokenAddress1,
        BigNumber.from("4000000000000000000"),
        100
      );

      // Add second token address to Masterchef contract
      const mockTokenAddress2: string = createAddress("0x5678");
      addLPTokenAddress(mockProvider, mockMasterchefAddress, 20, mockTokenAddress2, 100);
      // Add name of token
      addLPTokenName(
        mockProvider,
        mockTokenAddress2,
        "Test Token 2",
        100
      );
      // Add balance to the token contract (token address above) (balance of 4)
      addLPTokenBalance(
        mockProvider,
        mockMasterchefAddress,
        mockTokenAddress2,
        BigNumber.from("4000000000000000000"),
        100
      );

      // Add third token address to Masterchef contract
      const mockTokenAddress3: string = createAddress("0x6543");
      addLPTokenAddress(mockProvider, mockMasterchefAddress, 30, mockTokenAddress3, 100);
      // Add name of token
      addLPTokenName(
        mockProvider,
        mockTokenAddress3,
        "Test Token 3",
        100
      );
      // Add balance to the token contract (token address above) (balance of 4)
      addLPTokenBalance(
        mockProvider,
        mockMasterchefAddress,
        mockTokenAddress3,
        BigNumber.from("4000000000000000000"),
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
      handleTransaction = provideHandleTransaction(testDynamicConfig, provider, mockMasterchefFetcher, mockMasterchefAddress);

      // Add Deposit event
      const testSpender: string = createAddress("0x1");
      const depositLog = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Deposit"), [
        testSpender,
        10,
        BigNumber.from("2100000000000000000"), // 2.1
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(mockMasterchefAddress, depositLog.data, ...depositLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, mockMasterchefAddress, 10, mockTokenAddress, 100);
      // Add name of token
      addLPTokenName(
        mockProvider,
        mockTokenAddress,
        "Test Token 1",
        100
      );
      // Add balance to the token contract (token address above) (balance of 5)
      addLPTokenBalance(
        mockProvider,
        mockMasterchefAddress,
        mockTokenAddress,
        BigNumber.from("5000000000000000000"),
        100
      );

      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Should detect a large withdraw event", async () => {
      const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(100);
      handleTransaction = provideHandleTransaction(testDynamicConfig, provider, mockMasterchefFetcher, mockMasterchefAddress);

      // Add Withdraw event
      const testSpender: string = createAddress("0x9");
      const withdrawLog = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Withdraw"), [
        testSpender,
        20,
        BigNumber.from("3000000000000000000"), // 3
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(mockMasterchefAddress, withdrawLog.data, ...withdrawLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, mockMasterchefAddress, 20, mockTokenAddress, 100);
      // Add name of token
      addLPTokenName(
        mockProvider,
        mockTokenAddress,
        "Test Token 2",
        100
      );
      // Add balance to the token contract (token address above) (balance of 5)
      addLPTokenBalance(
        mockProvider,
        mockMasterchefAddress,
        mockTokenAddress,
        BigNumber.from("5000000000000000000"),
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
      handleTransaction = provideHandleTransaction(testDynamicConfig, provider, mockMasterchefFetcher, mockMasterchefAddress);

      // Add Withdraw event
      const testSpender: string = createAddress("0x9");
      const withdrawLog = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("Withdraw"), [
        testSpender,
        20,
        BigNumber.from("2400000000000000000"), // 2.4
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(mockMasterchefAddress, withdrawLog.data, ...withdrawLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, mockMasterchefAddress, 20, mockTokenAddress, 100);
      // Add name of token
      addLPTokenName(
        mockProvider,
        mockTokenAddress,
        "Test Token 2",
        100
      );
      // Add balance to the token contract (token address above) (balance of 5)
      addLPTokenBalance(
        mockProvider,
        mockMasterchefAddress,
        mockTokenAddress,
        BigNumber.from("5000000000000000000"),
        100
      );

      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    it("Should detect a large EmergencyWithdraw event", async () => {
      const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(100);
      handleTransaction = provideHandleTransaction(testDynamicConfig, provider, mockMasterchefFetcher, mockMasterchefAddress);

      // Add EmergencyWithdraw event
      const testSpender: string = createAddress("0x9");
      const withdrawLog = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("EmergencyWithdraw"), [
        testSpender,
        20,
        BigNumber.from("3000000000000000000"), // 3
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(mockMasterchefAddress, withdrawLog.data, ...withdrawLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, mockMasterchefAddress, 20, mockTokenAddress, 100);
      // Add name of token
      addLPTokenName(
        mockProvider,
        mockTokenAddress,
        "Test Token 2",
        100
      );
      // Add balance to the token contract (token address above) (balance of 5)
      addLPTokenBalance(
        mockProvider,
        mockMasterchefAddress,
        mockTokenAddress,
        BigNumber.from("5000000000000000000"),
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

    it("Should detect an EmergencyWithdraw event under the threshold", async () => {
      const txEvent: TestTransactionEvent = new TestTransactionEvent().setBlock(100);
      handleTransaction = provideHandleTransaction(testDynamicConfig, provider, mockMasterchefFetcher, mockMasterchefAddress);

      // Add EmergencyWithdraw event
      const testSpender: string = createAddress("0x9");
      const withdrawLog = MASTERCHEF_INTERFACE.encodeEventLog(MASTERCHEF_INTERFACE.getEvent("EmergencyWithdraw"), [
        testSpender,
        20,
        BigNumber.from("2490000000000000000"), // 2.49
      ]);
      // Create test transaction with the deposit event
      txEvent.addAnonymousEventLog(mockMasterchefAddress, withdrawLog.data, ...withdrawLog.topics);

      // Add token address to Masterchef contract
      const mockTokenAddress: string = createAddress("0x1234");
      addLPTokenAddress(mockProvider, mockMasterchefAddress, 20, mockTokenAddress, 100);
      // Add name of token
      addLPTokenName(
        mockProvider,
        mockTokenAddress,
        "Test Token 2",
        100
      );
      // Add balance to the token contract (token address above) (balance of 6)
      addLPTokenBalance(
        mockProvider,
        mockMasterchefAddress,
        mockTokenAddress,
        BigNumber.from("5000000000000000000"),
        100
      );

      const findings: Finding[] = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });
  });
});
