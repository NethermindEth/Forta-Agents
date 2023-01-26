import { FindingType, FindingSeverity, Finding, getJsonRpcUrl, ethers, HandleBlock, Initialize } from "forta-agent";
import { provideHandleBlock, provideInitialize } from "./agent";
import { TestBlockEvent } from "forta-agent-tools/lib/test/index";
import { createAddress } from "forta-agent-tools/lib/utils";
import { Flag, MINIMUM_THRESHOLD_TO_ETHER } from "./constants";

describe("POLYGON-VALIDATOR-SIGNER BOT TEST SUITE", () => {
  let handleBlock: HandleBlock;
  let mockEthersProvider: any;
  let initialize: Initialize;
  let flag: Flag;
  let mockUser: string;

  beforeEach(async () => {
    mockEthersProvider = {
      getBalance: jest.fn(),
    };
    flag = { wasOverThresholdAlert: false };

    mockUser = createAddress("0x01");
    initialize = provideInitialize(mockEthersProvider as any, flag, mockUser);
    handleBlock = provideHandleBlock(mockEthersProvider as any, flag, mockUser);
  });

  it("sets the flag to true when the balance is greater than the minimum threshold", async () => {
    const accountBalance = ethers.utils.parseEther("10.0");
    mockEthersProvider.getBalance = jest.fn(() => Promise.resolve(accountBalance));
    await initialize();
    expect(flag.wasOverThresholdAlert).toBe(true);
    expect(mockEthersProvider.getBalance).toHaveBeenCalledWith(mockUser);
  });

  it("sets the flag to false when the balance is less than the minimum threshold", async () => {
    const accountBalance = ethers.utils.parseEther("0.1");
    mockEthersProvider.getBalance = jest.fn(() => Promise.resolve(accountBalance));
    await initialize();
    expect(flag.wasOverThresholdAlert).toBe(false);
    expect(mockEthersProvider.getBalance).toHaveBeenCalledWith(mockUser);
  });

  it("throws an error when the provider fails to get the account balance", async () => {
    mockEthersProvider.getBalance = jest.fn(() => Promise.reject("failed to fetch balance"));
    try {
      await initialize();
    } catch (error) {
      expect(error).toEqual("failed to fetch balance");
      expect(mockEthersProvider.getBalance).toHaveBeenCalledWith(mockUser);
    }
  });

  it("should return an array of findings when the account balance is below the threshold and an over threshold alert has been sent", async () => {
    jest.spyOn(mockEthersProvider, "getBalance").mockResolvedValue(ethers.BigNumber.from("5000000000"));
    flag.wasOverThresholdAlert = true;
    const blockEvent = new TestBlockEvent().setNumber(10);
    const findings = await handleBlock(blockEvent);
    const balance = (await mockEthersProvider.getBalance(mockUser)).toString();
    const expectedFinding = Finding.fromObject({
      name: "Account balance below threshold!",
      description: `Account balance (${`${ethers.utils.formatEther(
        balance
      )} ETH`}) below threshold (${`${MINIMUM_THRESHOLD_TO_ETHER}) ETH`}`,
      alertId: "POLY-01",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        balance: ethers.utils.formatEther(balance),
      },
    });
    expect(findings).toEqual([expectedFinding]);
    expect(flag.wasOverThresholdAlert).toBe(false);
  });

  it("should return an array of findings when the account balance is above the threshold and an over threshold alert has not been sent", async () => {
    jest.spyOn(mockEthersProvider, "getBalance").mockResolvedValue(ethers.BigNumber.from("15000000000000000000"));
    flag.wasOverThresholdAlert = false;
    const txEvent = new TestBlockEvent().setNumber(10);
    const findings = await handleBlock(txEvent);
    const balance = (await mockEthersProvider.getBalance(mockUser)).toString();
    const expectedFinding = Finding.fromObject({
      name: "Account balance greater than threshold!",
      description: `Account balance (${`${ethers.utils.formatEther(
        balance
      )} ETH`}) above threshold (${`${MINIMUM_THRESHOLD_TO_ETHER}) ETH`}`,
      alertId: "POLY-02",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        balance: ethers.utils.formatEther(balance),
      },
    });
    expect(findings).toEqual([expectedFinding]);
    expect(flag.wasOverThresholdAlert).toBe(true);
  });

  it("should return an empty array when the account balance is above the threshold and an over threshold alert has been sent", async () => {
    jest.spyOn(mockEthersProvider, "getBalance").mockResolvedValue(ethers.BigNumber.from("15000000000000000000"));
    flag.wasOverThresholdAlert = true;
    const txEvent = new TestBlockEvent().setNumber(10);
    const findings = await handleBlock(txEvent);
    expect(findings).toEqual([]);
    expect(flag.wasOverThresholdAlert).toBe(true);
  });

  it("should return an empty array when the account balance is above the threshold and an over threshold alert has been sent", async () => {
    jest.spyOn(mockEthersProvider, "getBalance").mockResolvedValue(ethers.BigNumber.from("5000000000"));
    flag.wasOverThresholdAlert = false;
    const txEvent = new TestBlockEvent().setNumber(10);
    const findings = await handleBlock(txEvent);
    expect(findings).toEqual([]);
    expect(flag.wasOverThresholdAlert).toBe(false);
  });

  it("should return only one finding when the balance is below the threshold for more than two blocks", async () => {
    jest.spyOn(mockEthersProvider, "getBalance").mockResolvedValue(ethers.BigNumber.from("5000000000"));
    flag.wasOverThresholdAlert = true;
    const blockEvent1 = new TestBlockEvent().setNumber(10);
    const findings1 = await handleBlock(blockEvent1);
    const balance = (await mockEthersProvider.getBalance(mockUser)).toString();
    expect(findings1).toEqual([
      Finding.fromObject({
        name: "Account balance below threshold!",
        description: `Account balance (${`${ethers.utils.formatEther(
          balance
        )} ETH`}) below threshold (${`${MINIMUM_THRESHOLD_TO_ETHER}) ETH`}`,
        alertId: "POLY-01",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          balance: ethers.utils.formatEther(balance),
        },
      }),
    ]);
    const blockEvent2 = new TestBlockEvent().setNumber(11);
    const findings2 = await handleBlock(blockEvent2);
    expect(findings2).toEqual([]);
  });
  it("should return only one finding when the balance is above the threshold for more than two blocks", async () => {
    jest.spyOn(mockEthersProvider, "getBalance").mockResolvedValue(ethers.BigNumber.from("15000000000000000000"));
    flag.wasOverThresholdAlert = false;
    const blockEvent1 = new TestBlockEvent().setNumber(10);
    const findings1 = await handleBlock(blockEvent1);
    const balance = (await mockEthersProvider.getBalance(mockUser)).toString();
    const expectedFinding = Finding.fromObject({
      name: "Account balance greater than threshold!",
      description: `Account balance (${`${ethers.utils.formatEther(
        balance
      )} ETH`}) above threshold (${MINIMUM_THRESHOLD_TO_ETHER}) ETH`,
      alertId: "POLY-02",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        balance: ethers.utils.formatEther(balance),
      },
    });
    expect(findings1).toEqual([expectedFinding]);
    jest.spyOn(mockEthersProvider, "getBalance").mockResolvedValue(ethers.BigNumber.from("15000000000000000000"));
    const blockEvent2 = new TestBlockEvent().setNumber(11);
    const findings2 = await handleBlock(blockEvent2);
    expect(findings2).toEqual([]);
  });
});
