import { ethers, Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { createAddress, MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { AgentConfig, SmartCaller, toBn } from "./utils";
import { SET_DELEGATE_ABI, BALANCE_OF_ABI, TOTAL_SUPPLY_ABI } from "./constants";

const createChecksumAddress = (address: string) => ethers.utils.getAddress(createAddress(address.toLowerCase()));

const DELEGATE_REGISTRY_IFACE = new ethers.utils.Interface([SET_DELEGATE_ABI]);
const IRRELEVANT_IFACE = new ethers.utils.Interface(["event Event()"]);
const VE_BAL_TOKEN_IFACE = new ethers.utils.Interface([BALANCE_OF_ABI, TOTAL_SUPPLY_ABI]);
const DELEGATE_REGISTRY_ADDRESS = createChecksumAddress("0xdef1");
const VE_BAL_TOKEN_ADDRESS = createChecksumAddress("0xb41");

function createAbsoluteThresholdFinding(delegator: string, delegate: string, amount: ethers.BigNumber): Finding {
  return Finding.from({
    name: "Large veBAL Delegation",
    description: `A large delegation (in absolute terms) of ${toBn(amount)
      .shiftedBy(-18)
      .toString(10)} veBAL from ${delegator} to ${delegate} was detected`,
    alertId: "BAL-8-1",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      delegator,
      delegate,
      amount: amount.toString(),
    },
  });
}

function createPercentageThresholdFinding(
  delegator: string,
  delegate: string,
  amount: ethers.BigNumber,
  supplyPercentage: string
): Finding {
  return Finding.from({
    name: "Large veBAL Delegation",
    description: `A large delegation (${supplyPercentage}% of veBAL total supply) of ${toBn(amount)
      .shiftedBy(-18)
      .toString(10)} veBAL from ${delegator} to ${delegate} was detected`,
    alertId: "BAL-8-2",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      delegator,
      delegate,
      amount: amount.toString(),
      supplyPercentage: supplyPercentage,
    },
  });
}

const DEFAULT_CONFIG: AgentConfig = {
  delegateRegistryAddress: DELEGATE_REGISTRY_ADDRESS,
  veBalTokenAddress: VE_BAL_TOKEN_ADDRESS,
};

const ADDRESSES = new Array(10).fill(0).map((el, idx) => createChecksumAddress(`0x${idx + 1}`));

describe("Balancer Large Delegation Bot Test Suite", () => {
  let provider: ethers.providers.Provider;
  let mockProvider: MockEthersProvider;
  let handleTransaction: HandleTransaction;

  const setBalanceOf = (block: number, tokenAddress: string, account: string, balance: ethers.BigNumberish) => {
    mockProvider.addCallTo(tokenAddress, block, VE_BAL_TOKEN_IFACE, "balanceOf", {
      inputs: [account],
      outputs: [ethers.BigNumber.from(balance)],
    });
  };

  const setTotalSupply = (block: number, tokenAddress: string, totalSupply: ethers.BigNumberish) => {
    mockProvider.addCallTo(tokenAddress, block, VE_BAL_TOKEN_IFACE, "totalSupply", {
      inputs: [],
      outputs: [ethers.BigNumber.from(totalSupply)],
    });
  };

  beforeEach(() => {
    SmartCaller.clearCache();

    mockProvider = new MockEthersProvider();
    provider = mockProvider as unknown as ethers.providers.Provider;

    handleTransaction = provideHandleTransaction(DEFAULT_CONFIG, provider);
  });

  it("should return empty findings with an empty logs list", async () => {
    const transactionEvent = new TestTransactionEvent();

    expect(await handleTransaction(transactionEvent)).toStrictEqual([]);
  });

  it("should ignore target events emitted from another contract", async () => {
    const transactionEvent: TransactionEvent = new TestTransactionEvent().addInterfaceEventLog(
      DELEGATE_REGISTRY_IFACE.getEvent("SetDelegate"),
      ADDRESSES[0],
      [ADDRESSES[1], ethers.utils.formatBytes32String("balancer.eth"), ADDRESSES[2]]
    );

    expect(await handleTransaction(transactionEvent)).toStrictEqual([]);
    expect(mockProvider.call).not.toHaveBeenCalled();
  });

  it("should ignore other events emitted from target contract", async () => {
    const transactionEvent = new TestTransactionEvent().addInterfaceEventLog(
      IRRELEVANT_IFACE.getEvent("Event"),
      DELEGATE_REGISTRY_ADDRESS,
      []
    );

    expect(await handleTransaction(transactionEvent)).toStrictEqual([]);
    expect(mockProvider.call).not.toHaveBeenCalled();
  });

  it("should ignore delegations whose id is not 'balancer.eth'", async () => {
    const transactionEvent = new TestTransactionEvent().addInterfaceEventLog(
      DELEGATE_REGISTRY_IFACE.getEvent("SetDelegate"),
      DELEGATE_REGISTRY_ADDRESS,
      [ADDRESSES[1], ethers.utils.formatBytes32String("some.id"), ADDRESSES[2]]
    );

    expect(await handleTransaction(transactionEvent)).toStrictEqual([]);
    expect(mockProvider.call).not.toHaveBeenCalled();
  });

  it("should return a finding for a large (in absolute terms) veBAL delegation", async () => {
    const transactionEvent = new TestTransactionEvent()
      .setBlock(0)
      .addInterfaceEventLog(DELEGATE_REGISTRY_IFACE.getEvent("SetDelegate"), DELEGATE_REGISTRY_ADDRESS, [
        ADDRESSES[0],
        ethers.utils.formatBytes32String("balancer.eth"),
        ADDRESSES[1],
      ]);

    handleTransaction = provideHandleTransaction(
      {
        ...DEFAULT_CONFIG,
        absoluteThreshold: "100",
      },
      provider
    );

    setBalanceOf(0, VE_BAL_TOKEN_ADDRESS, ADDRESSES[0], "100");

    expect(await handleTransaction(transactionEvent)).toStrictEqual([
      createAbsoluteThresholdFinding(ADDRESSES[0], ADDRESSES[1], ethers.BigNumber.from("100")),
    ]);
    expect(mockProvider.call).toHaveBeenCalledTimes(1);
  });

  it("should not return a finding for a veBAL delegation that is not large (in absolute terms)", async () => {
    const transactionEvent = new TestTransactionEvent()
      .setBlock(0)
      .addInterfaceEventLog(DELEGATE_REGISTRY_IFACE.getEvent("SetDelegate"), DELEGATE_REGISTRY_ADDRESS, [
        ADDRESSES[0],
        ethers.utils.formatBytes32String("balancer.eth"),
        ADDRESSES[1],
      ]);

    handleTransaction = provideHandleTransaction(
      {
        ...DEFAULT_CONFIG,
        absoluteThreshold: "100",
      },
      provider
    );

    setBalanceOf(0, VE_BAL_TOKEN_ADDRESS, ADDRESSES[0], "50");

    expect(await handleTransaction(transactionEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(1);
  });

  it("should return a finding for a large (relative to the total supply) veBAL delegation", async () => {
    const transactionEvent = new TestTransactionEvent()
      .setBlock(0)
      .addInterfaceEventLog(DELEGATE_REGISTRY_IFACE.getEvent("SetDelegate"), DELEGATE_REGISTRY_ADDRESS, [
        ADDRESSES[0],
        ethers.utils.formatBytes32String("balancer.eth"),
        ADDRESSES[1],
      ]);

    handleTransaction = provideHandleTransaction(
      {
        ...DEFAULT_CONFIG,
        supplyPercentageThreshold: "50.5",
      },
      provider
    );

    setTotalSupply(0, VE_BAL_TOKEN_ADDRESS, "1000");
    setBalanceOf(0, VE_BAL_TOKEN_ADDRESS, ADDRESSES[0], "505");

    expect(await handleTransaction(transactionEvent)).toStrictEqual([
      createPercentageThresholdFinding(ADDRESSES[0], ADDRESSES[1], ethers.BigNumber.from("505"), "50.5"),
    ]);
    expect(mockProvider.call).toHaveBeenCalledTimes(2);
  });

  it("should not return a finding for a veBAL delegation that is not large (relative to the total supply)", async () => {
    const transactionEvent = new TestTransactionEvent()
      .setBlock(0)
      .addInterfaceEventLog(DELEGATE_REGISTRY_IFACE.getEvent("SetDelegate"), DELEGATE_REGISTRY_ADDRESS, [
        ADDRESSES[0],
        ethers.utils.formatBytes32String("balancer.eth"),
        ADDRESSES[1],
      ]);

    handleTransaction = provideHandleTransaction(
      {
        ...DEFAULT_CONFIG,
        supplyPercentageThreshold: "50.5",
      },
      provider
    );

    setTotalSupply(0, VE_BAL_TOKEN_ADDRESS, "1000");
    setBalanceOf(0, VE_BAL_TOKEN_ADDRESS, ADDRESSES[0], "500");

    expect(await handleTransaction(transactionEvent)).toStrictEqual([]);
    expect(mockProvider.call).toHaveBeenCalledTimes(2);
  });

  it("should return both finding types for a large (according to both thresholds) veBAL delegation", async () => {
    const transactionEvent = new TestTransactionEvent()
      .setBlock(0)
      .addInterfaceEventLog(DELEGATE_REGISTRY_IFACE.getEvent("SetDelegate"), DELEGATE_REGISTRY_ADDRESS, [
        ADDRESSES[0],
        ethers.utils.formatBytes32String("balancer.eth"),
        ADDRESSES[1],
      ]);

    handleTransaction = provideHandleTransaction(
      {
        ...DEFAULT_CONFIG,
        absoluteThreshold: "505",
        supplyPercentageThreshold: "50.5",
      },
      provider
    );

    setTotalSupply(0, VE_BAL_TOKEN_ADDRESS, "1000");
    setBalanceOf(0, VE_BAL_TOKEN_ADDRESS, ADDRESSES[0], "505");

    expect(await handleTransaction(transactionEvent)).toStrictEqual([
      createAbsoluteThresholdFinding(ADDRESSES[0], ADDRESSES[1], ethers.BigNumber.from("505")),
      createPercentageThresholdFinding(ADDRESSES[0], ADDRESSES[1], ethers.BigNumber.from("505"), "50.5"),
    ]);
    expect(mockProvider.call).toHaveBeenCalledTimes(2);
  });

  it("should return findings for each large veBAL delegation", async () => {
    const transactionEvent = new TestTransactionEvent()
      .setBlock(0)
      .addInterfaceEventLog(DELEGATE_REGISTRY_IFACE.getEvent("SetDelegate"), DELEGATE_REGISTRY_ADDRESS, [
        ADDRESSES[0],
        ethers.utils.formatBytes32String("balancer.eth"),
        ADDRESSES[9],
      ])
      .addInterfaceEventLog(DELEGATE_REGISTRY_IFACE.getEvent("SetDelegate"), DELEGATE_REGISTRY_ADDRESS, [
        ADDRESSES[1],
        ethers.utils.formatBytes32String("balancer.eth"),
        ADDRESSES[9],
      ])
      .addInterfaceEventLog(DELEGATE_REGISTRY_IFACE.getEvent("SetDelegate"), DELEGATE_REGISTRY_ADDRESS, [
        ADDRESSES[2],
        ethers.utils.formatBytes32String("balancer.eth"),
        ADDRESSES[9],
      ])
      .addInterfaceEventLog(DELEGATE_REGISTRY_IFACE.getEvent("SetDelegate"), DELEGATE_REGISTRY_ADDRESS, [
        ADDRESSES[3],
        ethers.utils.formatBytes32String("balancer.eth"),
        ADDRESSES[9],
      ])
      .addInterfaceEventLog(DELEGATE_REGISTRY_IFACE.getEvent("SetDelegate"), DELEGATE_REGISTRY_ADDRESS, [
        ADDRESSES[4],
        ethers.utils.formatBytes32String("balancer.eth"),
        ADDRESSES[9],
      ]);

    handleTransaction = provideHandleTransaction(
      {
        ...DEFAULT_CONFIG,
        absoluteThreshold: "100",
        supplyPercentageThreshold: "50.5",
      },
      provider
    );

    setTotalSupply(0, VE_BAL_TOKEN_ADDRESS, "1000");
    setBalanceOf(0, VE_BAL_TOKEN_ADDRESS, ADDRESSES[0], "0"); // no findings
    setBalanceOf(0, VE_BAL_TOKEN_ADDRESS, ADDRESSES[1], "50"); // no findings
    setBalanceOf(0, VE_BAL_TOKEN_ADDRESS, ADDRESSES[2], "300"); // absolute threshold finding
    setBalanceOf(0, VE_BAL_TOKEN_ADDRESS, ADDRESSES[3], "600"); // both findings
    setBalanceOf(0, VE_BAL_TOKEN_ADDRESS, ADDRESSES[4], "900"); // both findings

    expect(await handleTransaction(transactionEvent)).toStrictEqual([
      createAbsoluteThresholdFinding(ADDRESSES[2], ADDRESSES[9], ethers.BigNumber.from("300")),
      createAbsoluteThresholdFinding(ADDRESSES[3], ADDRESSES[9], ethers.BigNumber.from("600")),
      createAbsoluteThresholdFinding(ADDRESSES[4], ADDRESSES[9], ethers.BigNumber.from("900")),
      createPercentageThresholdFinding(ADDRESSES[3], ADDRESSES[9], ethers.BigNumber.from("600"), "60"),
      createPercentageThresholdFinding(ADDRESSES[4], ADDRESSES[9], ethers.BigNumber.from("900"), "90"),
    ]);
    expect(mockProvider.call).toHaveBeenCalledTimes(6);
  });
});
