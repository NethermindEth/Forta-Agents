import { ethers, HandleTransaction } from "forta-agent";

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
    const event = utils.EVENTS_IFACE.getEvent("Deposit");

    const mockTxEvent = new TestTransactionEvent()
      .setBlock(blockNumber)
      .addInterfaceEventLog(event, DEFAULT_CONFIG.lendingPoolAddress, eventArgs);
    handleTx = provideHandleTransaction(DEFAULT_CONFIG, mockProvider as any);
    const findings = await handleTx(mockTxEvent);
    expect(findings).toStrictEqual([]);
  });

  it("Should return a finding if the collateral are smaller than the borrowed amount", async () => {
    const blockNumber = 14435;
    const testUser = createAddress("0x02");
    const mockAddress = createAddress("0x03");
    const userTestData = [50, 10, 57, 1, 1, 1];
    const eventArgs = [mockAddress, mockAddress, testUser, 1];
    mockProvider.addCallTo(
      DEFAULT_CONFIG.lendingPoolAddress,
      blockNumber,
      utils.FUNCTIONS_IFACE,
      "getUserAccountData",
      { inputs: [testUser], outputs: [...userTestData] }
    );

    const event = utils.EVENTS_IFACE.getEvent("Withdraw");

    const mockTxEvent = new TestTransactionEvent()
      .setBlock(blockNumber)
      .addInterfaceEventLog(event, DEFAULT_CONFIG.lendingPoolAddress, eventArgs);
    handleTx = provideHandleTransaction(DEFAULT_CONFIG, mockProvider as any);
    const findings = await handleTx(mockTxEvent);
    expect(findings).toStrictEqual([
      utils.createFinding({
        collateralAmount: ethers.utils.formatEther(userTestData[0].toString()).toString(),
        borrowAmount: ethers.utils.formatEther(userTestData[2].toString()).toString(),
      }),
    ]);
  });
});
