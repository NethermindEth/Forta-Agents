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

async function addLogToProvider(
  mockTimelockProvider: MockEthersProvider,
  blockNumber: number,
  address: string,
  topics: string[],
  data: string,
  txHash?: string
) {
  mockTimelockProvider.addLogs([
    {
      blockNumber,
      data,
      address,
      topics,
      transactionHash: txHash,
    },
  ] as Log[]);
}

const addr = createChecksumAddress;

const FX_CHILD = addr("0xab1");
const LAST_MAINNET_BLOCK = 100;

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

const network = Network.MAINNET;

const DEFAULT_CONFIG: AgentConfig = {
  mainnetRpcEndpoint: "rpc-endpoint",
  networkData: {
    [network]: {
      bridgeReceiverAddress: addr("0xff1"),
      messagePassFetchingBlockStep: 50,
      messagePassFetchingBlockRange: 100,
    },
  },
};

describe("COMP2-5 - Bridge Proposal Integrity Monitor Bot Test suite", () => {
  const fxChild = addr("0xaefe");
  const fxRoot = addr("0xaefd");
  const timelock = addr("0xaeff");
  const BLOCK_NUMBER = 1;

  let mockEthProvider: MockEthersProvider;
  let mockProvider: MockEthersProvider;

  let ethProvider: ethers.providers.Provider;
  let provider: ethers.providers.Provider;

  let handleTransaction: HandleTransaction;
  let networkManager: NetworkManager<NetworkData>;

  async function addCallsToProvider(mockProvider: MockEthersProvider, blockNumber: string | number) {
    mockProvider.addCallTo(networkManager.get("bridgeReceiverAddress"), blockNumber, RECEIVER_IFACE, "fxChild", {
      inputs: [],
      outputs: [fxChild],
    });

    mockProvider.addCallTo(networkManager.get("bridgeReceiverAddress"), blockNumber, RECEIVER_IFACE, "govTimelock", {
      inputs: [],
      outputs: [timelock],
    });

    mockProvider.addCallTo(fxChild, BLOCK_NUMBER, new ethers.utils.Interface([FX_ROOT_ABI]), "fxRoot", {
      inputs: [],
      outputs: [fxRoot],
    });
  }

  beforeEach(async () => {
    mockEthProvider = new MockEthersProvider();
    mockEthProvider.setNetwork(network);
    mockEthProvider.setLatestBlock(LAST_MAINNET_BLOCK);

    ethProvider = mockEthProvider as unknown as ethers.providers.Provider;

    mockProvider = new MockEthersProvider();
    mockProvider.setNetwork(network);
    networkManager = new NetworkManager(DEFAULT_CONFIG.networkData);

    provider = mockProvider as unknown as ethers.providers.Provider;

    const initialize = provideInitialize(networkManager, provider);
    await initialize();

    const _getLogs = mockEthProvider.getLogs;
    mockEthProvider.getLogs = jest.fn((...args) => Promise.resolve(_getLogs(...args)));

    handleTransaction = provideHandleTransaction(networkManager, provider, ethProvider);

    await addCallsToProvider(mockProvider, BLOCK_NUMBER);
  });

  it("returns empty findings when no event is emitted", async () => {
    const txEvent = new TestTransactionEvent().setBlock(BLOCK_NUMBER);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("returns an Info finding if ProposalCreated event is emitted and corresponding ExecuteTransaction was found", async () => {
    const findings = [];
    for (const testData of PROPOSAL_TEST_DATA) {
      const transactionExecutedLog = EXECUTE_TX_IFACE.encodeEventLog(EXECUTE_TX_IFACE.getEvent("ExecuteTransaction"), [
        ethers.utils.formatBytes32String("hash1"),
        fxRoot,
        10,
        "",
        encodeCallData(testData.slice(2, 6), networkManager.get("bridgeReceiverAddress")),
        1,
      ]);

      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setBlock(BLOCK_NUMBER)
        .addEventLog(PROPOSAL_EVENT_ABI, networkManager.get("bridgeReceiverAddress"), testData);

      await addLogToProvider(
        mockEthProvider,
        1,
        timelock,
        transactionExecutedLog.topics,
        transactionExecutedLog.data,
        ethers.utils.formatBytes32String("tx1")
      );
      findings.push(await handleTransaction(txEvent));
    }

    expect(findings.flat()).toStrictEqual(
      PROPOSAL_TEST_DATA.map((data) =>
        createProposalFinding(
          network,
          networkManager.get("bridgeReceiverAddress"),
          data[1],
          ethers.utils.getAddress(data[0]),
          ethers.utils.formatBytes32String("tx1")
        )
      )
    );
  });

  it("returns a High Severity finding if ProposalCreated event is emitted and no ExecuteTransaction event was emitted", async () => {
    const findings = [];
    for (const testData of PROPOSAL_TEST_DATA) {
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setBlock(BLOCK_NUMBER)
        .addEventLog(PROPOSAL_EVENT_ABI, networkManager.get("bridgeReceiverAddress"), testData);

      await addLogToProvider(mockEthProvider, 1, timelock, [], "");
      findings.push(await handleTransaction(txEvent));
    }

    expect(findings.flat()).toStrictEqual(
      PROPOSAL_TEST_DATA.map((data) =>
        createSuspiciousProposalFinding(
          network,
          networkManager.get("bridgeReceiverAddress"),
          data[1],
          ethers.utils.getAddress(data[0])
        )
      )
    );
  });

  it("returns a High Severity finding if ProposalCreated event is emitted and no corresponding ExecuteTransaction event was found", async () => {
    const findings = [];
    for (const testData of PROPOSAL_TEST_DATA) {
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setBlock(BLOCK_NUMBER)
        .addEventLog(PROPOSAL_EVENT_ABI, networkManager.get("bridgeReceiverAddress"), testData);

      const transactionExecutedLog = EXECUTE_TX_IFACE.encodeEventLog(EXECUTE_TX_IFACE.getEvent("ExecuteTransaction"), [
        ethers.utils.formatBytes32String("hash1"),
        addr("0xd01"), // target is different from fxRoot
        10,
        "",
        encodeCallData(testData.slice(2, 6), networkManager.get("bridgeReceiverAddress")),
        1,
      ]);

      await addLogToProvider(mockEthProvider, 1, timelock, transactionExecutedLog.topics, transactionExecutedLog.data);

      findings.push(await handleTransaction(txEvent));
    }

    expect(findings.flat()).toStrictEqual(
      PROPOSAL_TEST_DATA.map((data) =>
        createSuspiciousProposalFinding(
          network,
          networkManager.get("bridgeReceiverAddress"),
          data[1],
          ethers.utils.getAddress(data[0])
        )
      )
    );
  });

  it("returns a High Severity finding if ProposalCreated event is emitted and corresponding ExecuteTransaction event has different data", async () => {
    const findings = [];
    for (const testData of PROPOSAL_TEST_DATA) {
      const txEvent: TransactionEvent = new TestTransactionEvent()
        .setBlock(BLOCK_NUMBER)
        .addEventLog(PROPOSAL_EVENT_ABI, networkManager.get("bridgeReceiverAddress"), testData);

      const transactionExecutedLog = EXECUTE_TX_IFACE.encodeEventLog(EXECUTE_TX_IFACE.getEvent("ExecuteTransaction"), [
        ethers.utils.formatBytes32String("hash1"),
        fxRoot,
        10,
        "",
        encodeCallData(DIFF_DATA.slice(2, 6), networkManager.get("bridgeReceiverAddress")), // data is different
        1,
      ]);

      await addLogToProvider(mockEthProvider, 1, timelock, transactionExecutedLog.topics, transactionExecutedLog.data);

      findings.push(await handleTransaction(txEvent));
    }

    expect(findings.flat()).toStrictEqual(
      PROPOSAL_TEST_DATA.map((data) =>
        createSuspiciousProposalFinding(
          network,
          networkManager.get("bridgeReceiverAddress"),
          data[1],
          ethers.utils.getAddress(data[0])
        )
      )
    );
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
      mockEthProvider.setNetwork(network);
      mockEthProvider.setLatestBlock(LAST_MAINNET_BLOCK);

      ethProvider = mockEthProvider as unknown as ethers.providers.Provider;

      const config: AgentConfig = {
        mainnetRpcEndpoint: "rpc-endpoint",
        networkData: {
          [network]: {
            bridgeReceiverAddress: addr("0xff1"),
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
        .addEventLog(PROPOSAL_EVENT_ABI, networkManager.get("bridgeReceiverAddress"), PROPOSAL_TEST_DATA[0]);

      await handleTransaction(txEvent);

      expect(mockEthProvider.getLogs).toHaveBeenCalledTimes(
        Math.ceil(
          networkManager.get("messagePassFetchingBlockRange") / networkManager.get("messagePassFetchingBlockStep")
        )
      );
    }
  });
});
