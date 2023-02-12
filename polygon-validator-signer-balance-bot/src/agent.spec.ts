import { FindingType, FindingSeverity, Finding, ethers, HandleBlock, Initialize } from "forta-agent";
import { provideHandleBlock, provideInitialize } from "./agent";
import { TestBlockEvent } from "forta-agent-tools/lib/test/index";
import { createAddress } from "forta-agent-tools/lib/utils";
import { Flag, MINIMUM_THRESHOLD_TO_ETHER } from "./constants";

describe("POLYGON-VALIDATOR-SIGNER BOT TEST SUITE", () => {
  let handleBlock: HandleBlock;
  let mockEthersProvider: any;
  let initialize: Initialize;
  let mockFlag: Flag = { wasOverThresholdAlert: false };
  let mockUser: string = createAddress("0x01");
  let mockThreshold: ethers.BigNumber = ethers.BigNumber.from("200000000000000000");

  beforeEach(async () => {
    mockEthersProvider = {
      getBalance: jest.fn(),
    };
    initialize = provideInitialize(mockEthersProvider, mockFlag, mockUser, mockThreshold);
    handleBlock = provideHandleBlock(mockEthersProvider, mockFlag, mockUser, mockThreshold);
  });

  it("sets the flag to true when the balance is greater than the minimum threshold", async () => {
    const accountBalance = ethers.utils.parseEther("0.21"); // 0.21 ETH
    mockEthersProvider.getBalance = jest.fn(() => Promise.resolve(accountBalance));
    await initialize();
    expect(mockFlag.wasOverThresholdAlert).toBe(true);
    expect(mockEthersProvider.getBalance).toHaveBeenCalledWith(mockUser);
  });

  it("sets the flag to false when the balance is less than the minimum threshold", async () => {
    const accountBalance = ethers.utils.parseEther("0.19"); // 0.19 ETH
    mockEthersProvider.getBalance = jest.fn(() => Promise.resolve(accountBalance));
    await initialize();
    expect(mockFlag.wasOverThresholdAlert).toBe(false);
    expect(mockEthersProvider.getBalance).toHaveBeenCalledWith(mockUser);
  });

  it("should return an array of findings when the account balance is below the threshold and an over threshold alert has been sent", async () => {
    const balance = ethers.BigNumber.from("5000000000"); // 0.000000005 ETH
    mockEthersProvider.getBalance.mockResolvedValue(balance);
    mockFlag.wasOverThresholdAlert = true;
    const blockEvent = new TestBlockEvent().setNumber(10);
    const findings = await handleBlock(blockEvent);
    const balanceString = (await mockEthersProvider.getBalance(mockUser)).toString();
    const expectedFinding = Finding.fromObject({
      name: "Account balance below threshold!",
      description: `Account balance (${ethers.utils.formatEther(
        balanceString
      )} ETH) below threshold (${MINIMUM_THRESHOLD_TO_ETHER} ETH)`,
      alertId: "POLY-01",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        balance: ethers.utils.formatEther(balanceString),
      },
    });
    expect(findings).toStrictEqual([expectedFinding]);
    expect(mockFlag.wasOverThresholdAlert).toBe(false);
  });

  it("should return an array of findings when the account balance is above the threshold and an over threshold alert has not been sent", async () => {
    const balance = ethers.BigNumber.from("15000000000000000000"); // 15 ETH
    mockEthersProvider.getBalance.mockResolvedValue(balance);
    mockFlag.wasOverThresholdAlert = false;
    const blockEvent = new TestBlockEvent().setNumber(10);
    const findings = await handleBlock(blockEvent);
    const balanceString = (await mockEthersProvider.getBalance(mockUser)).toString();
    const expectedFinding = Finding.fromObject({
      name: "Account balance greater than threshold!",
      description: `Account balance (${ethers.utils.formatEther(
        balanceString
      )} ETH) above threshold (${MINIMUM_THRESHOLD_TO_ETHER} ETH)`,
      alertId: "POLY-02",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        balance: ethers.utils.formatEther(balanceString),
      },
    });
    expect(findings).toStrictEqual([expectedFinding]);
    expect(mockFlag.wasOverThresholdAlert).toBe(true);
  });

  it("should return an empty array when the account balance is above the threshold and an over threshold alert has been sent", async () => {
    const balance = ethers.BigNumber.from("220000000000000000"); // 0.22 ETH
    mockEthersProvider.getBalance.mockResolvedValue(balance);
    mockFlag.wasOverThresholdAlert = true;
    const blockEvent = new TestBlockEvent().setNumber(10);
    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
    expect(mockFlag.wasOverThresholdAlert).toBe(true);
  });

  it("should return an empty array when the account balance is below threshold and a below threshold alert has been sent", async () => {
    const balance = ethers.BigNumber.from("170000000000000000"); // 0.17 ETH
    mockEthersProvider.getBalance.mockResolvedValue(balance);
    mockFlag.wasOverThresholdAlert = false;
    const blockEvent = new TestBlockEvent().setNumber(10);
    const findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
    expect(mockFlag.wasOverThresholdAlert).toBe(false);
  });

  it("should return only one finding when the balance is below the threshold for more than two blocks", async () => {
    const balance = ethers.BigNumber.from("5000000000"); // 0.000000005 ETH
    mockEthersProvider.getBalance.mockResolvedValue(balance);
    mockFlag.wasOverThresholdAlert = true;
    const blockEvent1 = new TestBlockEvent().setNumber(10);
    const findings1 = await handleBlock(blockEvent1);
    const balanceString = (await mockEthersProvider.getBalance(mockUser)).toString();
    expect(findings1).toStrictEqual([
      Finding.fromObject({
        name: "Account balance below threshold!",
        description: `Account balance (${ethers.utils.formatEther(
          balanceString
        )} ETH) below threshold (${MINIMUM_THRESHOLD_TO_ETHER} ETH)`,
        alertId: "POLY-01",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          balance: ethers.utils.formatEther(balanceString),
        },
      }),
    ]);
    const blockEvent2 = new TestBlockEvent().setNumber(12);
    const findings2 = await handleBlock(blockEvent2);
    expect(findings2).toStrictEqual([]);
  });
  it("should return only one finding when the balance is above the threshold for more than two blocks", async () => {
    const balance = ethers.BigNumber.from("15000000000000000000"); // 15 ETH
    mockEthersProvider.getBalance.mockResolvedValue(balance);
    mockFlag.wasOverThresholdAlert = false;
    const blockEvent1 = new TestBlockEvent().setNumber(10);
    const findings1 = await handleBlock(blockEvent1);
    const balanceString = (await mockEthersProvider.getBalance(mockUser)).toString();
    const expectedFinding = Finding.fromObject({
      name: "Account balance greater than threshold!",
      description: `Account balance (${ethers.utils.formatEther(
        balanceString
      )} ETH) above threshold (${MINIMUM_THRESHOLD_TO_ETHER} ETH)`,
      alertId: "POLY-02",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        balance: ethers.utils.formatEther(balanceString),
      },
    });
    expect(findings1).toStrictEqual([expectedFinding]);
    mockEthersProvider.getBalance.mockResolvedValue(balance);
    const blockEvent2 = new TestBlockEvent().setNumber(12);
    const findings2 = await handleBlock(blockEvent2);
    expect(findings2).toStrictEqual([]);
  });
});
