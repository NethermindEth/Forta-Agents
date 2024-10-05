import {
  ethers,
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent,
  Log,
  Network,
} from "forta-agent";
import { NetworkManager, createChecksumAddress } from "forta-agent-tools";
import { provideHandleTransaction, provideInitialize } from "./agent";

import { MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/test";
import {
  EXECUTE_TX_ABI,
  FX_CHILD_ABI,
  FX_ROOT_ABI,
  PROPOSAL_EVENT_ABI,
  SEND_MESSAGE_ABI,
  TIMELOCK_ABI,
} from "./constants";
import { AgentConfig, NetworkData } from "./utils";

const EXECUTE_TX_IFACE = new ethers.utils.Interface([EXECUTE_TX_ABI]);
const SEND_MESSAGE_IFACE = new ethers.utils.Interface([SEND_MESSAGE_ABI]);
const RECEIVER_IFACE = new ethers.utils.Interface([FX_CHILD_ABI, TIMELOCK_ABI]);
const IRRELEVANT_IFACE = new ethers.utils.Interface(["event SomeEvent()"]);

function createProposalFinding(
  chainId: number,
  bridgeReceiverAddress: string,
  id: string,
  fxChildAddress: string,
  txHash: string
): Finding {
  return Finding.from({
    name: "Proposal created on BridgeReceiver contract",
    description:
      "A ProposalCreated event was emitted on BridgeReceiver contract, the corresponding creation message was found",
    alertId: "COMP2-5-1",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      network: Network[chainId] || chainId.toString(),
      bridgeReceiver: bridgeReceiverAddress,
      proposalId: id,
      fxChild: fxChildAddress,
      txHash,
    },
    addresses: [bridgeReceiverAddress, fxChildAddress],
  });
}

function createSuspiciousProposalFinding(
  chainId: number,
  bridgeReceiverAddress: string,
  id: string,
  fxChild: string
): Finding {
  return Finding.from({
    name: "A suspicious proposal was created on BridgeReceiver contract",
    description:
      "A ProposalCreated event was emitted on BridgeReceiver contract, no corresponding creation message was found",
    alertId: "COMP2-5-2",
    protocol: "Compound",
    type: FindingType.Suspicious,
    severity: FindingSeverity.High,
    metadata: {
      network: Network[chainId] || chainId.toString(),
      bridgeReceiver: bridgeReceiverAddress,
      proposalId: id,
      fxChild,
    },
    addresses: [bridgeReceiverAddress, fxChild],
  });
}

function encodeCallData(dataArr: (string | number | string[] | number[])[], receiverAddr: string) {
  const data = ethers.utils.defaultAbiCoder.encode(["address[]", "uint256[]", "string[]", "bytes[]"], dataArr);
  const calldata = SEND_MESSAGE_IFACE.encodeFunctionData("sendMessageToChild", [receiverAddr, data]);
  return calldata;
}

const addr = createChecksumAddress;
const bn = ethers.BigNumber.from;
const hash = (str: string) => ethers.utils.keccak256(ethers.utils.formatBytes32String(str));

const FX_CHILD = addr("0xab1");
const LAST_MAINNET_BLOCK = 100;
const BLOCK_NUMBER = 10;
const NETWORK = Network.MAINNET;

const FX_CHILD_ADDRESS = addr("0xaefe");
const FX_ROOT_ADDRESS = addr("0xaefd");
const TIMELOCK_ADDRESS = addr("0xaeff");
const BRIDGE_RECEIVER_ADDRESS = addr("0xfff1");
const IRRELEVANT_ADDRESS = addr("0x1773");

const PROPOSAL_TEST_DATA: [string, string, string[], number[], string[], string[], number][] = [
  [
    FX_CHILD,
    "1",
    [addr("0x11a"), addr("0x11b")],
    [30, 20],
    ["function func1() public returns (uint256)", "function func2() public returns(uint)"],
    ["0x", "0x"],
    0,
  ],
  [
    FX_CHILD,
    "2",
    [addr("0x12a"), addr("0x12b")],
    [60, 20],
    ["function func1() public returns (uint256)", "function func2() public returns(uint)"],
    ["0x", "0x"],
    0,
  ],
  [FX_CHILD, "3", [addr("0x13a")], [30], ["function func1() public returns (uint256)"], ["0x"], 10],
];
const DIFF_DATA = [FX_CHILD, "4", [addr("0x14a")], [30], ["function func1() public returns (uint256)"], ["0x"], 10];

const DEFAULT_CONFIG: AgentConfig = {
  mainnetRpcEndpoint: "rpc-endpoint",
  networkData: {
    [NETWORK]: {
      bridgeReceiverAddress: BRIDGE_RECEIVER_ADDRESS,
      messagePassFetchingBlockStep: 50,
      messagePassFetchingBlockRange: 100,
    },
  },
};

describe("COMP2-5 - Bridge Proposal Integrity Monitor Bot Test suite", () => {
  let mockEthProvider: MockEthersProvider;
  let mockProvider: MockEthersProvider;

  let ethProvider: ethers.providers.Provider;
  let provider: ethers.providers.Provider;

  let handleTransaction: HandleTransaction;
  let networkManager: NetworkManager<NetworkData>;

  const addCallsToProvider = async (mockProvider: MockEthersProvider, blockNumber: string | number) => {
    mockProvider.addCallTo(BRIDGE_RECEIVER_ADDRESS, blockNumber, RECEIVER_IFACE, "fxChild", {
      inputs: [],
      outputs: [FX_CHILD_ADDRESS],
    });

    mockProvider.addCallTo(BRIDGE_RECEIVER_ADDRESS, blockNumber, RECEIVER_IFACE, "govTimelock", {
      inputs: [],
      outputs: [TIMELOCK_ADDRESS],
    });

    mockProvider.addCallTo(FX_CHILD_ADDRESS, BLOCK_NUMBER, new ethers.utils.Interface([FX_ROOT_ABI]), "fxRoot", {
      inputs: [],
      outputs: [FX_ROOT_ADDRESS],
    });
  };

  const addExecuteTransactionLog = (
    target: string,
    signature: string,
    data: string,
    block: number,
    txHash: string,
    timelock: string = TIMELOCK_ADDRESS
  ) => {
    mockEthProvider.addLogs([
      {
        ...EXECUTE_TX_IFACE.encodeEventLog("ExecuteTransaction", [hash("some"), target, bn(0), signature, data, 0]),
        blockNumber: block,
        address: timelock,
        transactionHash: txHash,
      },
    ] as Log[]);
  };

  const addIrrelevantLog = (address: string, block: number, mockProvider: MockEthersProvider) => {
    mockProvider.addLogs([
      {
        ...IRRELEVANT_IFACE.encodeEventLog("SomeEvent", []),
        blockNumber: block,
        address,
      },
    ] as Log[]);
  };

  beforeEach(async () => {
    mockEthProvider = new MockEthersProvider();
    mockEthProvider.setNetwork(NETWORK);
    mockEthProvider.setLatestBlock(LAST_MAINNET_BLOCK);

    ethProvider = mockEthProvider as unknown as ethers.providers.Provider;

    mockProvider = new MockEthersProvider();
    mockProvider.setNetwork(NETWORK);
    networkManager = new NetworkManager(DEFAULT_CONFIG.networkData);

    provider = mockProvider as unknown as ethers.providers.Provider;

    const initialize = provideInitialize(networkManager, provider);
    await initialize();

    const _getLogs = mockEthProvider.getLogs;
    mockEthProvider.getLogs = jest.fn((...args) => Promise.resolve(_getLogs(...args)));

    handleTransaction = provideHandleTransaction(networkManager, provider, ethProvider);

    await addCallsToProvider(mockProvider, BLOCK_NUMBER);
  });

  it("should not emit any findings when no event is emitted", async () => {
    const txEvent = new TestTransactionEvent().setBlock(BLOCK_NUMBER);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should not emit any findings when no ProposalCreated event is emitted", async () => {
    const txEvent = new TestTransactionEvent()
      .setBlock(BLOCK_NUMBER)
      .addEventLog(IRRELEVANT_IFACE.getEvent("SomeEvent"), IRRELEVANT_ADDRESS, []);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should not emit any findings when a ProposalCreated event is emitted from a different contract", async () => {
    for (const testData of PROPOSAL_TEST_DATA) {
      const txEvent = new TestTransactionEvent()
        .setBlock(BLOCK_NUMBER)
        .addEventLog(PROPOSAL_EVENT_ABI, IRRELEVANT_ADDRESS, testData);

      expect(await handleTransaction(txEvent)).toStrictEqual([]);
    }
  });

  it("should emit an info severity finding if a ProposalCreated event is emitted and a corresponding ExecuteTransaction was found", async () => {
    for (const testData of PROPOSAL_TEST_DATA) {
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setBlock(BLOCK_NUMBER)
        .addEventLog(PROPOSAL_EVENT_ABI, BRIDGE_RECEIVER_ADDRESS, testData);

      addExecuteTransactionLog(
        FX_ROOT_ADDRESS,
        "",
        encodeCallData(testData.slice(2, 6), BRIDGE_RECEIVER_ADDRESS),
        LAST_MAINNET_BLOCK,
        hash("tx1")
      );

      expect(await handleTransaction(txEvent)).toStrictEqual([
        createProposalFinding(
          NETWORK,
          BRIDGE_RECEIVER_ADDRESS,
          testData[1],
          ethers.utils.getAddress(testData[0]),
          hash("tx1")
        ),
      ]);
    }
  });

  it("should emit a high severity finding if a ProposalCreated event is emitted and no ExecuteTransaction event was emitted", async () => {
    for (const testData of PROPOSAL_TEST_DATA) {
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setBlock(BLOCK_NUMBER)
        .addEventLog(PROPOSAL_EVENT_ABI, BRIDGE_RECEIVER_ADDRESS, testData);

      addIrrelevantLog(TIMELOCK_ADDRESS, LAST_MAINNET_BLOCK, mockEthProvider);

      expect(await handleTransaction(txEvent)).toStrictEqual([
        createSuspiciousProposalFinding(
          NETWORK,
          BRIDGE_RECEIVER_ADDRESS,
          testData[1],
          ethers.utils.getAddress(testData[0])
        ),
      ]);
    }
  });

  it("should emit a high severity finding if a ProposalCreated event is emitted and no ExecuteTransaction event was found", async () => {
    for (const testData of PROPOSAL_TEST_DATA) {
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setBlock(BLOCK_NUMBER)
        .addEventLog(PROPOSAL_EVENT_ABI, BRIDGE_RECEIVER_ADDRESS, testData);

      expect(await handleTransaction(txEvent)).toStrictEqual([
        createSuspiciousProposalFinding(
          NETWORK,
          BRIDGE_RECEIVER_ADDRESS,
          testData[1],
          ethers.utils.getAddress(testData[0])
        ),
      ]);
    }
  });

  it("should emit a high severity finding if a ProposalCreated event is emitted and the ExecuteTransaction target is not the same", async () => {
    for (const testData of PROPOSAL_TEST_DATA) {
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setBlock(BLOCK_NUMBER)
        .addEventLog(PROPOSAL_EVENT_ABI, BRIDGE_RECEIVER_ADDRESS, testData);

      addExecuteTransactionLog(
        IRRELEVANT_ADDRESS,
        "",
        encodeCallData(testData.slice(2, 6), BRIDGE_RECEIVER_ADDRESS),
        LAST_MAINNET_BLOCK,
        hash("tx1")
      );

      expect(await handleTransaction(txEvent)).toStrictEqual([
        createSuspiciousProposalFinding(
          NETWORK,
          BRIDGE_RECEIVER_ADDRESS,
          testData[1],
          ethers.utils.getAddress(testData[0])
        ),
      ]);
    }
  });

  it("should emit a high severity finding if a ProposalCreated event is emitted and the ExecuteTransaction event was emitted by a different contract", async () => {
    for (const testData of PROPOSAL_TEST_DATA) {
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setBlock(BLOCK_NUMBER)
        .addEventLog(PROPOSAL_EVENT_ABI, BRIDGE_RECEIVER_ADDRESS, testData);

      addExecuteTransactionLog(
        FX_ROOT_ADDRESS,
        "",
        encodeCallData(testData.slice(2, 6), BRIDGE_RECEIVER_ADDRESS),
        LAST_MAINNET_BLOCK,
        hash("tx1"),
        IRRELEVANT_ADDRESS
      );

      expect(await handleTransaction(txEvent)).toStrictEqual([
        createSuspiciousProposalFinding(
          NETWORK,
          BRIDGE_RECEIVER_ADDRESS,
          testData[1],
          ethers.utils.getAddress(testData[0])
        ),
      ]);
    }
  });

  it("should emit a high severity finding if a ProposalCreated event is emitted and corresponding ExecuteTransaction event has different data", async () => {
    for (const testData of PROPOSAL_TEST_DATA) {
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setBlock(BLOCK_NUMBER)
        .addEventLog(PROPOSAL_EVENT_ABI, BRIDGE_RECEIVER_ADDRESS, testData);

      addExecuteTransactionLog(
        FX_ROOT_ADDRESS,
        "",
        encodeCallData(DIFF_DATA.slice(2, 6), BRIDGE_RECEIVER_ADDRESS),
        LAST_MAINNET_BLOCK,
        hash("tx1")
      );

      expect(await handleTransaction(txEvent)).toStrictEqual([
        createSuspiciousProposalFinding(
          NETWORK,
          BRIDGE_RECEIVER_ADDRESS,
          testData[1],
          ethers.utils.getAddress(testData[0])
        ),
      ]);
    }
  });

  it("should be able to emit multiple findings per transaction", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setBlock(BLOCK_NUMBER)
      .addEventLog(PROPOSAL_EVENT_ABI, BRIDGE_RECEIVER_ADDRESS, PROPOSAL_TEST_DATA[0])
      .addEventLog(PROPOSAL_EVENT_ABI, BRIDGE_RECEIVER_ADDRESS, PROPOSAL_TEST_DATA[1]);

    addExecuteTransactionLog(
      FX_ROOT_ADDRESS,
      "",
      encodeCallData(PROPOSAL_TEST_DATA[0].slice(2, 6), BRIDGE_RECEIVER_ADDRESS),
      LAST_MAINNET_BLOCK,
      hash("tx1")
    );

    addExecuteTransactionLog(
      FX_ROOT_ADDRESS,
      "",
      encodeCallData(DIFF_DATA.slice(2, 6), BRIDGE_RECEIVER_ADDRESS),
      LAST_MAINNET_BLOCK,
      hash("tx2")
    );

    expect(await handleTransaction(txEvent)).toStrictEqual([
      createProposalFinding(
        NETWORK,
        BRIDGE_RECEIVER_ADDRESS,
        PROPOSAL_TEST_DATA[0][1],
        ethers.utils.getAddress(PROPOSAL_TEST_DATA[0][0]),
        hash("tx1")
      ),
      createSuspiciousProposalFinding(
        NETWORK,
        BRIDGE_RECEIVER_ADDRESS,
        PROPOSAL_TEST_DATA[1][1],
        ethers.utils.getAddress(PROPOSAL_TEST_DATA[1][0])
      ),
    ]);
  });

  it("fetches blocks correctly using batches", async () => {
    let networkManager: NetworkManager<NetworkData>;
    const blockBatches = [
      [10, 100],
      [20, 100],
      [25, 100],
      [30, 100],
      [40, 100],
    ];

    for (const blocksData of blockBatches) {
      mockEthProvider = new MockEthersProvider();
      mockEthProvider.setNetwork(NETWORK);
      mockEthProvider.setLatestBlock(LAST_MAINNET_BLOCK);

      ethProvider = mockEthProvider as unknown as ethers.providers.Provider;

      const config: AgentConfig = {
        mainnetRpcEndpoint: "rpc-endpoint",
        networkData: {
          [NETWORK]: {
            bridgeReceiverAddress: BRIDGE_RECEIVER_ADDRESS,
            messagePassFetchingBlockStep: blocksData[0],
            messagePassFetchingBlockRange: blocksData[1],
          },
        },
      };

      networkManager = new NetworkManager(config.networkData);
      await networkManager.init(ethProvider);

      handleTransaction = provideHandleTransaction(networkManager, provider, ethProvider);

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setBlock(BLOCK_NUMBER)
        .addEventLog(PROPOSAL_EVENT_ABI, BRIDGE_RECEIVER_ADDRESS, PROPOSAL_TEST_DATA[0]);

      await handleTransaction(txEvent);

      expect(mockEthProvider.getLogs).toHaveBeenCalledTimes(
        Math.ceil(
          networkManager.get("messagePassFetchingBlockRange") / networkManager.get("messagePassFetchingBlockStep")
        )
      );
    }
  });
});
