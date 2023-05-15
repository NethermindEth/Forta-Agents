import { ethers, Finding, FindingSeverity, FindingType, HandleTransaction, Log, Network } from "forta-agent";
import { MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/test";
import { createChecksumAddress, NetworkManager } from "forta-agent-tools";

import { AgentConfig, NetworkData, pastBlockChunks } from "./utils";
import { provideInitialize, provideHandleTransaction } from "./agent";
import { EXECUTE_TRANSACTION_ABI, LOCAL_TIMELOCK_ABI, PROPOSAL_CREATED_ABI, PROPOSAL_EXECUTED_ABI } from "./constants";

const addr = createChecksumAddress;
const bn = ethers.BigNumber.from;

const BRIDGE_RECEIVER_ADDRESS = addr("0xb41d");
const TIMELOCK_ADDRESS = addr("0x1e10c");
const IRRELEVANT_ADDRESS = addr("0x1443");

const BRIDGE_RECEIVER_IFACE = new ethers.utils.Interface([
  PROPOSAL_CREATED_ABI,
  PROPOSAL_EXECUTED_ABI,
  LOCAL_TIMELOCK_ABI,
]);
const SOME_IFACE = new ethers.utils.Interface([
  "function methodA(uint256 value) external returns (uint256)",
  "function methodB(uint256 value1, uint256 value2) external returns (uint256)",
]);

const network = Network.MAINNET;

const DEFAULT_CONFIG: AgentConfig = {
  [network]: {
    bridgeReceiverAddress: BRIDGE_RECEIVER_ADDRESS,
    creationFetchingBlockRange: 1000,
    creationFetchingBlockStep: 100,
  },
};

function createSuccessfulProposalExecutionFinding(
  bridgeReceiver: string,
  timelock: string,
  proposalId: ethers.BigNumberish,
  chainId: number
): Finding {
  return Finding.from({
    name: "Successful proposal execution on bridge receiver",
    description: "A bridge receiver proposal was fully executed",
    alertId: "COMP2-6-1",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      chain: Network[chainId],
      bridgeReceiver: ethers.utils.getAddress(bridgeReceiver),
      timelock: ethers.utils.getAddress(timelock),
      proposalId: proposalId.toString(),
    },
    addresses: [ethers.utils.getAddress(bridgeReceiver), ethers.utils.getAddress(timelock)],
  });
}

function createUnsuccessfulProposalExecutionFinding(
  bridgeReceiver: string,
  timelock: string,
  proposalId: ethers.BigNumberish,
  chainId: number
): Finding {
  return Finding.from({
    name: "Unsuccessful proposal execution on bridge receiver",
    description: "A bridge receiver proposal was not fully executed",
    alertId: "COMP2-6-2",
    protocol: "Compound",
    type: FindingType.Suspicious,
    severity: FindingSeverity.Unknown,
    metadata: {
      chain: Network[chainId],
      bridgeReceiver: ethers.utils.getAddress(bridgeReceiver),
      timelock: ethers.utils.getAddress(timelock),
      proposalId: proposalId.toString(),
    },
    addresses: [ethers.utils.getAddress(bridgeReceiver), ethers.utils.getAddress(timelock)],
  });
}

function createUnknownTimelockExecutionFinding(
  bridgeReceiver: string,
  timelock: string,
  txHash: string,
  target: string,
  value: ethers.BigNumberish,
  signature: string,
  data: string,
  eta: ethers.BigNumberish,
  chainId: number
): Finding {
  return Finding.from({
    name: "Unknown transaction was executed through the Timelock contract",
    description:
      "A transaction that is not linked to any proposal was executed through the Timelock contract. This might have been due to the proposal creation not being recognized, please check the bot logs.",
    alertId: "COMP2-6-3",
    protocol: "Compound",
    type: FindingType.Suspicious,
    severity: FindingSeverity.Unknown,
    metadata: {
      chain: Network[chainId],
      bridgeReceiver: ethers.utils.getAddress(bridgeReceiver),
      timelock: ethers.utils.getAddress(timelock),
      txHash,
      target: ethers.utils.getAddress(target),
      value: value.toString(),
      signature,
      data,
      eta: eta.toString(),
    },
    addresses: [
      ethers.utils.getAddress(bridgeReceiver),
      ethers.utils.getAddress(timelock),
      ethers.utils.getAddress(target),
    ],
  });
}

interface ProposalCall {
  txHash: string;
  target: string;
  value: ethers.BigNumber;
  signature: string;
  data: string;
  eta: ethers.BigNumber;
}

function getTxHash(target: string, value: ethers.BigNumberish, method: string, args: ethers.BigNumberish[]) {
  return ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(`${target.toLowerCase()}-${value.toString()}-${method}-${args.map((el) => el.toString())}`)
  );
}

function proposalCall(
  target: string,
  value: ethers.BigNumberish,
  method: string,
  args: ethers.BigNumberish[],
  eta: ethers.BigNumberish
): ProposalCall {
  return {
    txHash: getTxHash(target, value, method, args),
    target,
    value: bn(value),
    signature: SOME_IFACE.getFunction(method).format("sighash"),
    data: SOME_IFACE.encodeFunctionData(
      method,
      args.map((el) => bn(el))
    ),
    eta: bn(eta),
  };
}

interface Proposal {
  id: ethers.BigNumber;
  eta: ethers.BigNumber;
  calls: ProposalCall[];
}

function createProposal(id: ethers.BigNumberish, calls: ProposalCall[], eta: ethers.BigNumberish) {
  if (calls.some((call) => !call.eta.eq(eta))) {
    throw new Error("Trying to create proposal with mismatching call ETAs");
  }

  return { id: bn(id), eta: bn(eta), calls };
}

describe("Bot Test Suite", () => {
  let provider: ethers.providers.Provider;
  let mockProvider: MockEthersProvider;
  let networkManager: NetworkManager<NetworkData>;
  let handleTransaction: HandleTransaction;

  function setLocalTimelock(block: number) {
    mockProvider.addCallTo(BRIDGE_RECEIVER_ADDRESS, block, BRIDGE_RECEIVER_IFACE, "localTimelock", {
      inputs: [],
      outputs: [TIMELOCK_ADDRESS],
    });
  }

  function addProposalCreation(from: string, proposal: Proposal, block: number) {
    mockProvider.addLogs([
      {
        ...BRIDGE_RECEIVER_IFACE.encodeEventLog("ProposalCreated", [
          ethers.constants.AddressZero,
          bn(proposal.id),
          proposal.calls.map((call) => call.target),
          proposal.calls.map((call) => call.value),
          proposal.calls.map((call) => call.signature),
          proposal.calls.map((call) => call.data),
          proposal.eta,
        ]),
        address: from,
        blockNumber: block,
      } as Log,
    ]);
  }

  function addTransactionExecutions(txEvent: TestTransactionEvent, from: string, calls: ProposalCall[]) {
    calls.forEach((call) => {
      txEvent.addEventLog(EXECUTE_TRANSACTION_ABI, from, [
        call.txHash,
        call.target,
        call.value,
        call.signature,
        call.data,
        call.eta,
      ]);
    });
  }

  function addProposalExecution(txEvent: TestTransactionEvent, from: string, id: ethers.BigNumberish) {
    txEvent.addEventLog(PROPOSAL_EXECUTED_ABI, from, [id]);
  }

  beforeEach(async () => {
    mockProvider = new MockEthersProvider();
    mockProvider.setNetwork(network);

    provider = mockProvider as unknown as ethers.providers.Provider;

    networkManager = new NetworkManager(DEFAULT_CONFIG);
    const initialize = provideInitialize(networkManager, provider);

    await initialize();

    handleTransaction = provideHandleTransaction(networkManager, provider);
  });

  it("should correctly get the network data", async () => {
    expect(networkManager.getNetwork()).toStrictEqual(network);

    Object.entries(DEFAULT_CONFIG[network]).forEach(([key, value]) => {
      expect(networkManager.get(key as keyof NetworkData)).toStrictEqual(value);
    });
  });

  it("should return empty findings when no event is emitted", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
  });

  it("should not check the current timelock if no event is emitted", async () => {
    const txEvent = new TestTransactionEvent().setBlock(1);

    await handleTransaction(txEvent);

    expect(mockProvider.call).not.toHaveBeenCalledWith(
      {
        from: undefined,
        to: BRIDGE_RECEIVER_ADDRESS,
        data: BRIDGE_RECEIVER_IFACE.encodeFunctionData("localTimelock"),
      },
      txEvent.blockNumber
    );
  });

  it("should check the current timelock address if an ExecuteTransaction event is emitted", async () => {
    const calls = [proposalCall(addr("0xc014ac11"), bn(0), "methodA", [0], 0)];

    const txEvent = new TestTransactionEvent().setBlock(1);
    addTransactionExecutions(txEvent, TIMELOCK_ADDRESS, calls);

    setLocalTimelock(txEvent.blockNumber);

    await handleTransaction(txEvent);
    expect(mockProvider.call).toHaveBeenCalledWith(
      {
        from: undefined,
        to: BRIDGE_RECEIVER_ADDRESS,
        data: BRIDGE_RECEIVER_IFACE.encodeFunctionData("localTimelock"),
      },
      txEvent.blockNumber
    );
  });

  it("should not check proposal creations if there's no relevant transaction executions and no relevant proposal executions", async () => {
    const calls = [proposalCall(addr("0xc014ac11"), bn(0), "methodA", [0], 0)];

    const txEvent = new TestTransactionEvent().setBlock(1);
    addTransactionExecutions(txEvent, IRRELEVANT_ADDRESS, calls);
    addProposalExecution(txEvent, IRRELEVANT_ADDRESS, 0);

    setLocalTimelock(txEvent.blockNumber);

    expect(await handleTransaction(txEvent)).toStrictEqual([]);
    pastBlockChunks(
      txEvent.blockNumber,
      DEFAULT_CONFIG[network].creationFetchingBlockRange,
      DEFAULT_CONFIG[network].creationFetchingBlockStep
    ).forEach(([from, to]) => {
      expect(mockProvider.getLogs).not.toHaveBeenCalledWith({
        address: BRIDGE_RECEIVER_ADDRESS,
        topics: [BRIDGE_RECEIVER_IFACE.getEventTopic("ProposalCreated")],
        fromBlock: from,
        toBlock: to,
      });
    });
  });

  it("should check proposal creations if there's relevant transaction executions and relevant proposal executions", async () => {
    const calls = [proposalCall(addr("0xc014ac11"), bn(0), "methodA", [0], 0)];

    const txEvent = new TestTransactionEvent().setBlock(1001);
    addTransactionExecutions(txEvent, TIMELOCK_ADDRESS, calls);
    addProposalExecution(txEvent, BRIDGE_RECEIVER_ADDRESS, 0);

    setLocalTimelock(txEvent.blockNumber);

    const { creationFetchingBlockRange, creationFetchingBlockStep } = DEFAULT_CONFIG[network];

    const chunks = pastBlockChunks(
      txEvent.blockNumber,
      DEFAULT_CONFIG[network].creationFetchingBlockRange,
      DEFAULT_CONFIG[network].creationFetchingBlockStep
    );
    const expectedChunks = [];

    for (
      let from = txEvent.blockNumber - creationFetchingBlockRange + 1;
      from <= txEvent.blockNumber;
      from += creationFetchingBlockStep
    ) {
      expectedChunks.push([from, Math.min(from + creationFetchingBlockStep - 1, txEvent.blockNumber)]);
    }

    await handleTransaction(txEvent);

    expect(chunks).toStrictEqual(expectedChunks);
    chunks.forEach(([from, to]) => {
      expect(mockProvider.getLogs).toHaveBeenCalledWith({
        address: BRIDGE_RECEIVER_ADDRESS,
        topics: [BRIDGE_RECEIVER_IFACE.getEventTopic("ProposalCreated")],
        fromBlock: from,
        toBlock: to,
      });
    });
  });

  it("should add a warn log if the proposal creation event for executed proposals was not found", async () => {
    const calls = [proposalCall(addr("0xc014ac11"), bn(0), "methodA", [0], 0)];

    const warnLogSpy = jest.spyOn(console, "warn");
    const txEvent = new TestTransactionEvent().setBlock(1001);
    addTransactionExecutions(txEvent, TIMELOCK_ADDRESS, calls);
    addProposalExecution(txEvent, BRIDGE_RECEIVER_ADDRESS, 0);
    addProposalExecution(txEvent, BRIDGE_RECEIVER_ADDRESS, 1);

    setLocalTimelock(txEvent.blockNumber);

    await handleTransaction(txEvent);

    expect(warnLogSpy).toHaveBeenCalledWith(
      "Current creationFetchingBlockRange parameter is too low, so some proposal creations couldnt'be fetched. Please consider increasing it."
    );
    expect(warnLogSpy).toHaveBeenCalledWith("Missed proposal IDs: 0, 1");
  });

  it("should emit a finding if an executed transaction could not be associated with any proposal", async () => {
    const calls = [
      proposalCall(addr("0xc014ac11"), bn(0), "methodA", [0], 0),
      proposalCall(addr("0xc014ac12"), bn(1), "methodB", [1, 2], 1),
    ];

    const txEvent = new TestTransactionEvent().setBlock(1001);
    addTransactionExecutions(txEvent, TIMELOCK_ADDRESS, calls);

    setLocalTimelock(txEvent.blockNumber);

    expect((await handleTransaction(txEvent)).sort()).toStrictEqual(
      [
        createUnknownTimelockExecutionFinding(
          BRIDGE_RECEIVER_ADDRESS,
          TIMELOCK_ADDRESS,
          calls[0].txHash,
          calls[0].target,
          calls[0].value,
          calls[0].signature,
          calls[0].data,
          calls[0].eta,
          network
        ),
        createUnknownTimelockExecutionFinding(
          BRIDGE_RECEIVER_ADDRESS,
          TIMELOCK_ADDRESS,
          calls[1].txHash,
          calls[1].target,
          calls[1].value,
          calls[1].signature,
          calls[1].data,
          calls[1].eta,
          network
        ),
      ].sort()
    );
  });

  it("should emit a finding if a proposal was not fully executed", async () => {
    const calls = [
      proposalCall(addr("0xc014ac11"), bn(0), "methodA", [0], 0),
      proposalCall(addr("0xc014ac12"), bn(1), "methodA", [1], 0),
      proposalCall(addr("0xc014ac12"), bn(2), "methodB", [2, 3], 0),
      proposalCall(addr("0xc014ac12"), bn(3), "methodB", [4, 5], 1),
    ];

    const proposals = [createProposal(0, calls.slice(0, 3), 0), createProposal(1, [calls[3]], 1)];

    proposals.forEach((proposal) => addProposalCreation(BRIDGE_RECEIVER_ADDRESS, proposal, 2));

    const txEvent = new TestTransactionEvent().setBlock(1001);
    addTransactionExecutions(txEvent, TIMELOCK_ADDRESS, [calls[0], calls[1]]);
    proposals.forEach((proposal) => addProposalExecution(txEvent, BRIDGE_RECEIVER_ADDRESS, proposal.id));

    setLocalTimelock(txEvent.blockNumber);

    expect((await handleTransaction(txEvent)).sort()).toStrictEqual(
      [
        createUnsuccessfulProposalExecutionFinding(BRIDGE_RECEIVER_ADDRESS, TIMELOCK_ADDRESS, 0, network),
        createUnsuccessfulProposalExecutionFinding(BRIDGE_RECEIVER_ADDRESS, TIMELOCK_ADDRESS, 1, network),
      ].sort()
    );
  });

  it("should emit a finding if a proposal was fully executed", async () => {
    const calls = [
      proposalCall(addr("0xc014ac11"), bn(0), "methodA", [0], 0),
      proposalCall(addr("0xc014ac12"), bn(1), "methodA", [1], 0),
      proposalCall(addr("0xc014ac12"), bn(2), "methodB", [2, 3], 0),
      proposalCall(addr("0xc014ac12"), bn(3), "methodB", [4, 5], 1),
    ];

    const proposals = [createProposal(0, calls.slice(0, 3), 0), createProposal(1, [calls[3]], 1)];

    proposals.forEach((proposal) => addProposalCreation(BRIDGE_RECEIVER_ADDRESS, proposal, 2));

    const txEvent = new TestTransactionEvent().setBlock(1001);
    addTransactionExecutions(txEvent, TIMELOCK_ADDRESS, calls);
    proposals.forEach((proposal) => addProposalExecution(txEvent, BRIDGE_RECEIVER_ADDRESS, proposal.id));

    setLocalTimelock(txEvent.blockNumber);

    expect((await handleTransaction(txEvent)).sort()).toStrictEqual(
      [
        createSuccessfulProposalExecutionFinding(BRIDGE_RECEIVER_ADDRESS, TIMELOCK_ADDRESS, 0, network),
        createSuccessfulProposalExecutionFinding(BRIDGE_RECEIVER_ADDRESS, TIMELOCK_ADDRESS, 1, network),
      ].sort()
    );
  });

  it("should be able to emit all findings independently", async () => {
    const calls = [
      proposalCall(addr("0xc014ac11"), bn(0), "methodA", [0], 0),
      proposalCall(addr("0xc014ac12"), bn(1), "methodA", [1], 1),
      proposalCall(addr("0xc014ac12"), bn(2), "methodB", [2, 3], 2),
      proposalCall(addr("0xc014ac12"), bn(3), "methodB", [4, 5], 2),
    ];

    const proposals = [createProposal(0, [calls[1]], 1), createProposal(1, [calls[2], calls[3]], 2)];

    proposals.forEach((proposal) => addProposalCreation(BRIDGE_RECEIVER_ADDRESS, proposal, 2));

    const txEvent = new TestTransactionEvent().setBlock(1001);
    addTransactionExecutions(txEvent, TIMELOCK_ADDRESS, calls.slice(0, 3));
    proposals.forEach((proposal) => addProposalExecution(txEvent, BRIDGE_RECEIVER_ADDRESS, proposal.id));

    setLocalTimelock(txEvent.blockNumber);

    expect((await handleTransaction(txEvent)).sort()).toStrictEqual(
      [
        createUnknownTimelockExecutionFinding(
          BRIDGE_RECEIVER_ADDRESS,
          TIMELOCK_ADDRESS,
          calls[0].txHash,
          calls[0].target,
          calls[0].value,
          calls[0].signature,
          calls[0].data,
          calls[0].eta,
          network
        ),
        createSuccessfulProposalExecutionFinding(BRIDGE_RECEIVER_ADDRESS, TIMELOCK_ADDRESS, 0, network),
        createUnsuccessfulProposalExecutionFinding(BRIDGE_RECEIVER_ADDRESS, TIMELOCK_ADDRESS, 1, network),
      ].sort()
    );
  });
});
