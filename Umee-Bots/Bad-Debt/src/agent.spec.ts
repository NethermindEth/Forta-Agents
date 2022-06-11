import { ethers, Finding, HandleTransaction } from "forta-agent";

import { createAddress, MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/tests";

import agent, { provideHandleTransaction } from "./agent";
import utils, { AgentConfig } from "./utils";

const DEFAULT_CONFIG: AgentConfig = {
  lendingPoolAddress: createAddress("0x01"),
};

describe("Bad debt tests suit", () => {
  let handleTx: HandleTransaction;
  const mockProvider = new MockEthersProvider();

  beforeEach(() => {
    handleTx = agent.handleTransaction;
  });
  it("Should return empty finding if the collateral are bigger than the borrowed amount", async () => {
    const blockNumber = 14435;
    const testUser = createAddress("0x02");
    const mockAddress = createAddress("0x03");
    const userTestData = [50, 10, 5, 1, 1, 1];
    const eventArgs = [mockAddress, mockAddress, testUser, 1, 1];
    mockProvider.addCallTo(
      DEFAULT_CONFIG.lendingPoolAddress,
      blockNumber,
      utils.FUNCTIONS_IFACE,
      "getUserAccountData",
      { inputs: [testUser], outputs: [...userTestData] }
    );

    const mockTxEvent = new TestTransactionEvent()
      .setBlock(blockNumber)
      .addInterfaceEventLog(utils.EVENTS_IFACE.getEvent("Deposit"), DEFAULT_CONFIG.lendingPoolAddress, eventArgs);
    handleTx = provideHandleTransaction(DEFAULT_CONFIG, mockProvider as any);
    const findings = await handleTx(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });

  it("Should return a finding if the collateral are smaller than the borrowed amount", async () => {
    const blockNumber = 14435;
    const testUser = createAddress("0x02");
    const mockAddress = createAddress("0x03");
    const userTestData = [50, 10, 57, 1, 1, 1];
    const eventArgs = [mockAddress, testUser, mockAddress, 1];
    mockProvider.addCallTo(
      DEFAULT_CONFIG.lendingPoolAddress,
      blockNumber,
      utils.FUNCTIONS_IFACE,
      "getUserAccountData",
      { inputs: [testUser], outputs: [...userTestData] }
    );

    const mockTxEvent = new TestTransactionEvent()
      .setBlock(blockNumber)
      .addInterfaceEventLog(utils.EVENTS_IFACE.getEvent("Withdraw"), DEFAULT_CONFIG.lendingPoolAddress, eventArgs);
    handleTx = provideHandleTransaction(DEFAULT_CONFIG, mockProvider as any);
    const findings = await handleTx(mockTxEvent);
    expect(findings).toStrictEqual([
      utils.createFinding({
        collateralAmount: ethers.utils.formatEther(userTestData[0].toString()).toString(),
        borrowAmount: ethers.utils.formatEther(userTestData[2].toString()).toString(),
      }),
    ]);
  });

  it("should return one finding for each market interaction after which the relevant account collateral amount is less than the borrowed amount", async () => {
    const blockNumber = 14435;
    const testUser = createAddress("0x02");
    const mockAddress = createAddress("0x03");
    const userTestData = [50, 10, 57, 1, 1, 1];

    const swapEventArgs = [mockAddress, testUser, 1];
    const flashLoanEventArgs = [testUser, mockAddress, mockAddress, 1, 1, 1];
    const borrowEventArgs = [mockAddress, mockAddress, testUser, 1, 1, 1, 1];

    const finding: Finding = utils.createFinding({
      collateralAmount: ethers.utils.formatEther(userTestData[0].toString()).toString(),
      borrowAmount: ethers.utils.formatEther(userTestData[2].toString()).toString(),
    });
    const expectedFindings: Finding[] = [finding, finding, finding];

    mockProvider.addCallTo(
      DEFAULT_CONFIG.lendingPoolAddress,
      blockNumber,
      utils.FUNCTIONS_IFACE,
      "getUserAccountData",
      { inputs: [testUser], outputs: [...userTestData] }
    );

    const mockTxEvent = new TestTransactionEvent()
      .setBlock(blockNumber)
      .addInterfaceEventLog(utils.EVENTS_IFACE.getEvent("Swap"), DEFAULT_CONFIG.lendingPoolAddress, swapEventArgs)
      .addInterfaceEventLog(
        utils.EVENTS_IFACE.getEvent("FlashLoan"),
        DEFAULT_CONFIG.lendingPoolAddress,
        flashLoanEventArgs
      )
      .addInterfaceEventLog(utils.EVENTS_IFACE.getEvent("Borrow"), DEFAULT_CONFIG.lendingPoolAddress, borrowEventArgs);

    handleTx = provideHandleTransaction(DEFAULT_CONFIG, mockProvider as any);
    const findings = await handleTx(mockTxEvent);
    expect(findings).toStrictEqual(expectedFindings);
  });

  it("should return one finding for each account interaction with the market with collateral amount is less than the borrowed amount", async () => {
    const blockNumber = 14435;
    const users = [createAddress("0x01"), createAddress("0x02"), createAddress("0x03")];

    const mockAddress = createAddress("0x05");
    const userTestData = [50, 10, 57, 1, 1, 1];

    const swapEventArgs = [mockAddress, users[0], 1];
    const flashLoanEventArgs = [users[1], mockAddress, mockAddress, 1, 1, 1];
    const borrowEventArgs = [mockAddress, mockAddress, users[2], 1, 1, 1, 1];

    const finding: Finding = utils.createFinding({
      collateralAmount: ethers.utils.formatEther(userTestData[0].toString()).toString(),
      borrowAmount: ethers.utils.formatEther(userTestData[2].toString()).toString(),
    });
    const expectedFindings: Finding[] = [finding, finding, finding];

    for (let index = 0; index < users.length; index++) {
      mockProvider.addCallTo(
        DEFAULT_CONFIG.lendingPoolAddress,
        blockNumber,
        utils.FUNCTIONS_IFACE,
        "getUserAccountData",
        { inputs: [users[index]], outputs: [...userTestData] }
      );
    }

    const mockTxEvent = new TestTransactionEvent()
      .setBlock(blockNumber)
      .addInterfaceEventLog(utils.EVENTS_IFACE.getEvent("Swap"), DEFAULT_CONFIG.lendingPoolAddress, swapEventArgs)
      .addInterfaceEventLog(
        utils.EVENTS_IFACE.getEvent("FlashLoan"),
        DEFAULT_CONFIG.lendingPoolAddress,
        flashLoanEventArgs
      )
      .addInterfaceEventLog(utils.EVENTS_IFACE.getEvent("Borrow"), DEFAULT_CONFIG.lendingPoolAddress, borrowEventArgs);

    handleTx = provideHandleTransaction(DEFAULT_CONFIG, mockProvider as any);
    const findings = await handleTx(mockTxEvent);
    expect(findings).toStrictEqual(expectedFindings);
  });
});
