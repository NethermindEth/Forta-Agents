import { ethers, Finding, FindingSeverity, FindingType, HandleTransaction, Network } from "forta-agent";
import { MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/test";
import { createChecksumAddress, NetworkManager } from "forta-agent-tools";

import { provideInitialize, provideHandleTransaction } from "./agent";
import { AgentConfig, NetworkData } from "./utils";
import {
  APPROVE_THIS_ABI,
  EXECUTE_TRANSACTION_ABI,
  PAUSE_ACTION_ABI,
  QUEUE_TRANSACTION_ABI,
  WITHDRAW_RESERVES_ABI,
} from "./constants";

function createPauseActionFinding(
  comet: string,
  supplyPaused: boolean,
  transferPaused: boolean,
  withdrawPaused: boolean,
  absorbPaused: boolean,
  buyPaused: boolean,
  chainId: number
): Finding {
  return Finding.from({
    name: "Pause action on Comet contract",
    description: "A pause action was executed in a Comet contract",
    alertId: "COMP2-2-1",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.High,
    metadata: {
      chain: Network[chainId],
      comet,
      supplyPaused: supplyPaused.toString(),
      transferPaused: transferPaused.toString(),
      withdrawPaused: withdrawPaused.toString(),
      absorbPaused: absorbPaused.toString(),
      buyPaused: buyPaused.toString(),
    },
    addresses: [comet],
  });
}

function createWithdrawReservesFinding(
  comet: string,
  to: string,
  amount: ethers.BigNumberish,
  chainId: number
): Finding {
  return Finding.from({
    name: "Withdraw reserves action on Comet contract",
    description: "A withdraw reserves action was executed in a Comet contract",
    alertId: "COMP2-2-2",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.High,
    metadata: {
      chain: Network[chainId],
      comet,
      to,
      amount: amount.toString(),
    },
    addresses: [comet, to],
  });
}

function createApproveThisQueueingFinding(
  timelock: string,
  comet: string,
  token: string,
  spender: string,
  amount: ethers.BigNumberish,
  txHash: string,
  chainId: number
): Finding {
  return Finding.from({
    name: "Token approval from Comet contract was queued on timelock governor",
    description: "An approveThis call to a Comet contract was queued",
    alertId: "COMP2-2-3",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.High,
    metadata: {
      chain: Network[chainId] || chainId.toString(),
      timelock: ethers.utils.getAddress(timelock),
      txHash,
      comet: ethers.utils.getAddress(comet),
      token: ethers.utils.getAddress(token),
      spender: ethers.utils.getAddress(spender),
      amount: amount.toString(),
    },
    addresses: [
      ethers.utils.getAddress(token),
      ethers.utils.getAddress(comet),
      ethers.utils.getAddress(timelock),
      ethers.utils.getAddress(spender),
    ],
  });
}

function createApproveThisExecutionFinding(
  timelock: string,
  comet: string,
  token: string,
  spender: string,
  amount: ethers.BigNumberish,
  txHash: string,
  chainId: number
): Finding {
  return Finding.from({
    name: "Token approval from Comet contract was executed on timelock governor",
    description: "An approveThis to from a Comet contract was executed",
    alertId: "COMP2-2-4",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.High,
    metadata: {
      chain: Network[chainId] || chainId.toString(),
      timelock: ethers.utils.getAddress(timelock),
      txHash,
      comet: ethers.utils.getAddress(comet),
      token: ethers.utils.getAddress(token),
      spender: ethers.utils.getAddress(spender),
      amount: amount.toString(),
    },
    addresses: [
      ethers.utils.getAddress(token),
      ethers.utils.getAddress(comet),
      ethers.utils.getAddress(timelock),
      ethers.utils.getAddress(spender),
    ],
  });
}

const addr = createChecksumAddress;
const hash = (str: string) => ethers.utils.keccak256(ethers.utils.formatBytes32String(str));

const COMET_ADDRESSES = [addr("0x1"), addr("0x2")];
const COMET_TIMELOCK_ADDRESSES = [addr("0x1001"), addr("0x1002")];
const TOKEN_ADDRESS = addr("0x3");
const IRRELEVANT_ADDRESS = addr("0x4");
const IFACE = new ethers.utils.Interface([APPROVE_THIS_ABI]);

const NETWORK = Network.MAINNET;

const DEFAULT_CONFIG: AgentConfig = {
  [NETWORK]: {
    cometContracts: COMET_ADDRESSES.map((address, idx) => ({
      address,
      timelockGovernorAddress: COMET_TIMELOCK_ADDRESSES[idx],
    })),
  },
};

describe("COMP2-2 - Governance Events Bot Test Suite", () => {
  let provider: ethers.providers.Provider;
  let mockProvider: MockEthersProvider;
  let networkManager: NetworkManager<NetworkData>;
  let handleTransaction: HandleTransaction;

  function addExecuteTransaction(
    txEvent: TestTransactionEvent,
    target: string,
    signature: string,
    data: string,
    timelock: string,
    txHash: string
  ) {
    txEvent.addEventLog(EXECUTE_TRANSACTION_ABI, timelock, [
      txHash,
      target,
      ethers.constants.Zero,
      signature,
      data,
      ethers.constants.Zero,
    ]);
  }

  function addQueueTransaction(
    txEvent: TestTransactionEvent,
    target: string,
    signature: string,
    data: string,
    timelock: string,
    txHash: string
  ) {
    txEvent.addEventLog(QUEUE_TRANSACTION_ABI, timelock, [
      txHash,
      target,
      ethers.constants.Zero,
      signature,
      data,
      ethers.constants.Zero,
    ]);
  }

  beforeEach(async () => {
    mockProvider = new MockEthersProvider();
    mockProvider.setNetwork(NETWORK);

    provider = mockProvider as unknown as ethers.providers.Provider;

    networkManager = new NetworkManager(DEFAULT_CONFIG);
    const initialize = provideInitialize(networkManager, provider);

    await initialize();

    handleTransaction = provideHandleTransaction(networkManager);
  });

  it("should correctly get network data", async () => {
    expect(networkManager.getNetwork()).toStrictEqual(NETWORK);
    expect(networkManager.get("cometContracts")).toStrictEqual(DEFAULT_CONFIG[Network.MAINNET].cometContracts);
  });

  it("should return empty findings when no event is emitted", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should ignore some target events emitted from other contracts", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    txEvent.addEventLog(PAUSE_ACTION_ABI, IRRELEVANT_ADDRESS, [false, false, false, false, false]);
    txEvent.addEventLog(WITHDRAW_RESERVES_ABI, IRRELEVANT_ADDRESS, [addr("0x0"), 0]);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should ignore other events emitted from target contracts", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    COMET_ADDRESSES.forEach((comet) => {
      txEvent.addEventLog("event SomeEvent(uint256 arg)", comet, [0]);
    });

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should return a finding if there's a PauseAction emission from a Comet contract", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    const comet = COMET_ADDRESSES[0];
    const supplyPaused = true;
    const transferPaused = false;
    const withdrawPaused = true;
    const absorbPaused = false;
    const buyPaused = true;
    const expectedFinding = createPauseActionFinding(
      comet,
      supplyPaused,
      transferPaused,
      withdrawPaused,
      absorbPaused,
      buyPaused,
      NETWORK
    );

    txEvent.addEventLog(PAUSE_ACTION_ABI, comet, [
      supplyPaused,
      transferPaused,
      withdrawPaused,
      absorbPaused,
      buyPaused,
    ]);

    expect(await handleTransaction(txEvent)).toStrictEqual([expectedFinding]);
  });

  it("should return a finding if there's a WithdrawReserves emission from a Comet contract", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    const comet = COMET_ADDRESSES[0];
    const to = addr("0xdef1");
    const amount = 1000;
    const expectedFinding = createWithdrawReservesFinding(comet, to, amount, NETWORK);

    txEvent.addEventLog(WITHDRAW_RESERVES_ABI, comet, [to, amount]);

    expect(await handleTransaction(txEvent)).toStrictEqual([expectedFinding]);
  });

  it("should not return a finding if there's an ExecuteTransaction emission of another method", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    const comet = COMET_ADDRESSES[0];
    const timelock = COMET_TIMELOCK_ADDRESSES[0];

    addExecuteTransaction(txEvent, comet, "someMethod()", "0x", timelock, hash("tx1"));

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should not return a finding if there's an approveThis ExecuteTransaction emission from an irrelevant address", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    const comet = COMET_ADDRESSES[0];
    const timelock = IRRELEVANT_ADDRESS;

    const manager = addr("0xdef1");
    const asset = TOKEN_ADDRESS;
    const amount = 1000;

    addExecuteTransaction(
      txEvent,
      comet,
      "approveThis(address,address,uint256)",
      ethers.utils.hexDataSlice(IFACE.encodeFunctionData("approveThis", [manager, asset, amount]), 4),
      timelock,
      hash("tx1")
    );

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should not return a finding if there's an approveThis ExecuteTransaction emission with an irrelevant address as target", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    const comet = IRRELEVANT_ADDRESS;
    const timelock = COMET_TIMELOCK_ADDRESSES[0];

    const manager = addr("0xdef1");
    const asset = TOKEN_ADDRESS;
    const amount = 1000;

    addExecuteTransaction(
      txEvent,
      comet,
      "approveThis(address,address,uint256)",
      ethers.utils.hexDataSlice(IFACE.encodeFunctionData("approveThis", [manager, asset, amount]), 4),
      timelock,
      hash("tx1")
    );

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should return a finding if there's an approveThis ExecuteTransaction emission with a comet contract as target", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    const comet = COMET_ADDRESSES[0];
    const timelock = COMET_TIMELOCK_ADDRESSES[0];

    const manager = addr("0xdef1");
    const asset = TOKEN_ADDRESS;
    const amount = 1000;

    addExecuteTransaction(
      txEvent,
      comet,
      "approveThis(address,address,uint256)",
      ethers.utils.hexDataSlice(IFACE.encodeFunctionData("approveThis", [manager, asset, amount]), 4),
      timelock,
      hash("tx1")
    );

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createApproveThisExecutionFinding(timelock, comet, asset, manager, amount, hash("tx1"), NETWORK),
    ]);
  });

  it("should not return a finding if there's an QueueTransaction emission of another method", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    const comet = COMET_ADDRESSES[0];
    const timelock = COMET_TIMELOCK_ADDRESSES[0];

    addQueueTransaction(txEvent, comet, "someMethod()", "0x", timelock, hash("tx1"));

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should not return a finding if there's an approveThis QueueTransaction emission from an irrelevant address", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    const comet = COMET_ADDRESSES[0];
    const timelock = IRRELEVANT_ADDRESS;

    const manager = addr("0xdef1");
    const asset = TOKEN_ADDRESS;
    const amount = 1000;

    addQueueTransaction(
      txEvent,
      comet,
      "approveThis(address,address,uint256)",
      ethers.utils.hexDataSlice(IFACE.encodeFunctionData("approveThis", [manager, asset, amount]), 4),
      timelock,
      hash("tx1")
    );

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should not return a finding if there's an approveThis QueueTransaction emission with an irrelevant address as target", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    const comet = IRRELEVANT_ADDRESS;
    const timelock = COMET_TIMELOCK_ADDRESSES[0];

    const manager = addr("0xdef1");
    const asset = TOKEN_ADDRESS;
    const amount = 1000;

    addQueueTransaction(
      txEvent,
      comet,
      "approveThis(address,address,uint256)",
      ethers.utils.hexDataSlice(IFACE.encodeFunctionData("approveThis", [manager, asset, amount]), 4),
      timelock,
      hash("tx1")
    );

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should return a finding if there's an approveThis QueueTransaction emission with a comet contract as target", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    const comet = COMET_ADDRESSES[0];
    const timelock = COMET_TIMELOCK_ADDRESSES[0];

    const manager = addr("0xdef1");
    const asset = TOKEN_ADDRESS;
    const amount = 1000;

    addQueueTransaction(
      txEvent,
      comet,
      "approveThis(address,address,uint256)",
      ethers.utils.hexDataSlice(IFACE.encodeFunctionData("approveThis", [manager, asset, amount]), 4),
      timelock,
      hash("tx1")
    );

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createApproveThisQueueingFinding(timelock, comet, asset, manager, amount, hash("tx1"), NETWORK),
    ]);
  });

  it("should return multiple findings if there's multiple events", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    const comet = COMET_ADDRESSES[0];
    const timelock = COMET_TIMELOCK_ADDRESSES[0];

    txEvent.addEventLog(PAUSE_ACTION_ABI, comet, [true, false, true, false, true]);
    txEvent.addEventLog(PAUSE_ACTION_ABI, comet, [false, true, false, true, false]);

    txEvent.addEventLog(WITHDRAW_RESERVES_ABI, comet, [addr("0xdef1"), 1000]);
    txEvent.addEventLog(WITHDRAW_RESERVES_ABI, comet, [addr("0xf00d"), 2000]);

    addQueueTransaction(
      txEvent,
      comet,
      "approveThis(address,address,uint256)",
      ethers.utils.hexDataSlice(IFACE.encodeFunctionData("approveThis", [addr("0xdef1"), addr("0x10431"), 1000]), 4),
      timelock,
      hash("tx1")
    );
    addQueueTransaction(
      txEvent,
      comet,
      "approveThis(address,address,uint256)",
      ethers.utils.hexDataSlice(IFACE.encodeFunctionData("approveThis", [addr("0xdef2"), addr("0x10432"), 2000]), 4),
      timelock,
      hash("tx2")
    );

    addExecuteTransaction(
      txEvent,
      comet,
      "approveThis(address,address,uint256)",
      ethers.utils.hexDataSlice(IFACE.encodeFunctionData("approveThis", [addr("0xdef1"), addr("0x10431"), 1000]), 4),
      timelock,
      hash("tx3")
    );
    addExecuteTransaction(
      txEvent,
      comet,
      "approveThis(address,address,uint256)",
      ethers.utils.hexDataSlice(IFACE.encodeFunctionData("approveThis", [addr("0xdef2"), addr("0x10432"), 2000]), 4),
      timelock,
      hash("tx4")
    );

    const findings = await handleTransaction(txEvent);
    expect(findings.sort()).toStrictEqual(
      [
        createPauseActionFinding(comet, true, false, true, false, true, NETWORK),
        createPauseActionFinding(comet, false, true, false, true, false, NETWORK),
        createWithdrawReservesFinding(comet, addr("0xdef1"), 1000, NETWORK),
        createWithdrawReservesFinding(comet, addr("0xf00d"), 2000, NETWORK),
        createApproveThisQueueingFinding(timelock, comet, addr("0x10431"), addr("0xdef1"), 1000, hash("tx1"), NETWORK),
        createApproveThisQueueingFinding(timelock, comet, addr("0x10432"), addr("0xdef2"), 2000, hash("tx2"), NETWORK),
        createApproveThisExecutionFinding(timelock, comet, addr("0x10431"), addr("0xdef1"), 1000, hash("tx3"), NETWORK),
        createApproveThisExecutionFinding(timelock, comet, addr("0x10432"), addr("0xdef2"), 2000, hash("tx4"), NETWORK),
      ].sort()
    );
  });

  it("should link findings to the correct comet address", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    txEvent.addEventLog(PAUSE_ACTION_ABI, COMET_ADDRESSES[0], [true, false, true, false, true]);
    txEvent.addEventLog(PAUSE_ACTION_ABI, COMET_ADDRESSES[1], [false, true, false, true, false]);

    txEvent.addEventLog(WITHDRAW_RESERVES_ABI, COMET_ADDRESSES[1], [addr("0xdef1"), 1000]);
    txEvent.addEventLog(WITHDRAW_RESERVES_ABI, COMET_ADDRESSES[0], [addr("0xf00d"), 2000]);

    addQueueTransaction(
      txEvent,
      COMET_ADDRESSES[0],
      "approveThis(address,address,uint256)",
      ethers.utils.hexDataSlice(IFACE.encodeFunctionData("approveThis", [addr("0xdef1"), addr("0x10431"), 1000]), 4),
      COMET_TIMELOCK_ADDRESSES[0],
      hash("tx1")
    );
    addQueueTransaction(
      txEvent,
      COMET_ADDRESSES[1],
      "approveThis(address,address,uint256)",
      ethers.utils.hexDataSlice(IFACE.encodeFunctionData("approveThis", [addr("0xdef2"), addr("0x10432"), 2000]), 4),
      COMET_TIMELOCK_ADDRESSES[1],
      hash("tx2")
    );

    addExecuteTransaction(
      txEvent,
      COMET_ADDRESSES[0],
      "approveThis(address,address,uint256)",
      ethers.utils.hexDataSlice(IFACE.encodeFunctionData("approveThis", [addr("0xdef1"), addr("0x10431"), 1000]), 4),
      COMET_TIMELOCK_ADDRESSES[0],
      hash("tx3")
    );
    addExecuteTransaction(
      txEvent,
      COMET_ADDRESSES[1],
      "approveThis(address,address,uint256)",
      ethers.utils.hexDataSlice(IFACE.encodeFunctionData("approveThis", [addr("0xdef2"), addr("0x10432"), 2000]), 4),
      COMET_TIMELOCK_ADDRESSES[1],
      hash("tx4")
    );

    const findings = await handleTransaction(txEvent);
    expect(findings.sort()).toStrictEqual(
      [
        createPauseActionFinding(COMET_ADDRESSES[0], true, false, true, false, true, NETWORK),
        createPauseActionFinding(COMET_ADDRESSES[1], false, true, false, true, false, NETWORK),
        createWithdrawReservesFinding(COMET_ADDRESSES[1], addr("0xdef1"), 1000, NETWORK),
        createWithdrawReservesFinding(COMET_ADDRESSES[0], addr("0xf00d"), 2000, NETWORK),
        createApproveThisQueueingFinding(
          COMET_TIMELOCK_ADDRESSES[0],
          COMET_ADDRESSES[0],
          addr("0x10431"),
          addr("0xdef1"),
          1000,
          hash("tx1"),
          NETWORK
        ),
        createApproveThisQueueingFinding(
          COMET_TIMELOCK_ADDRESSES[1],
          COMET_ADDRESSES[1],
          addr("0x10432"),
          addr("0xdef2"),
          2000,
          hash("tx2"),
          NETWORK
        ),
        createApproveThisExecutionFinding(
          COMET_TIMELOCK_ADDRESSES[0],
          COMET_ADDRESSES[0],
          addr("0x10431"),
          addr("0xdef1"),
          1000,
          hash("tx3"),
          NETWORK
        ),
        createApproveThisExecutionFinding(
          COMET_TIMELOCK_ADDRESSES[1],
          COMET_ADDRESSES[1],
          addr("0x10432"),
          addr("0xdef2"),
          2000,
          hash("tx4"),
          NETWORK
        ),
      ].sort()
    );
  });
});
