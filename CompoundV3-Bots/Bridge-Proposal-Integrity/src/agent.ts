import { Finding, Initialize, HandleTransaction, TransactionEvent, ethers, getEthersBatchProvider } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import CONFIG from "./agent.config";
import { AgentConfig, NetworkData, encodePacked } from "./utils";
import {
  EXECUTE_TX_ABI,
  FX_CHILD_ABI,
  FX_ROOT_ABI,
  PROPOSAL_EVENT_ABI,
  SEND_MESSAGE_ABI,
  TIMELOCK_ABI,
} from "./constants";
import { ProposalCreatedFinding, SuspiciousProposalCreatedFinding } from "./finding";

const networkManager = new NetworkManager(CONFIG.networkData);
const SEND_MESSAGE_IFACE = new ethers.utils.Interface([SEND_MESSAGE_ABI]);
const EXECUTE_TX_IFACE = new ethers.utils.Interface([EXECUTE_TX_ABI]);

export const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};

export const provideHandleTransaction = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider,
  ethProvider: ethers.providers.Provider
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const proposalLogs = txEvent.filterLog(PROPOSAL_EVENT_ABI, networkManager.get("bridgeReceiver"));

    if (!proposalLogs.length) return findings;

    const bridgeReceiver: ethers.Contract = new ethers.Contract(
      networkManager.get("bridgeReceiver"),
      [FX_CHILD_ABI, TIMELOCK_ABI],
      provider
    );

    // fetch mainnet Timelock contract and FxRoot
    const [fxChild, govTimelock] = await Promise.all([
      bridgeReceiver.fxChild({ blockTag: txEvent.blockNumber }),
      bridgeReceiver.govTimelock({ blockTag: txEvent.blockNumber }),
    ]);

    const fxChildContract = new ethers.Contract(fxChild, [FX_ROOT_ABI], provider);
    const fxRoot = ethers.utils.getAddress(await fxChildContract.fxRoot({ blockTag: txEvent.blockNumber }));

    for (const proposalLog of proposalLogs) {
      // encode bridged message
      const data = ethers.utils.defaultAbiCoder.encode(
        ["address[]", "uint256[]", "string[]", "bytes[]"],
        [proposalLog.args.targets, proposalLog.args[3], proposalLog.args.signatures, proposalLog.args.calldatas]
      );

      const calldata = SEND_MESSAGE_IFACE.encodeFunctionData("sendMessageToChild", [
        networkManager.get("bridgeReceiver"),
        data,
      ]);

      const timeLockContract = new ethers.Contract(govTimelock, EXECUTE_TX_IFACE, ethProvider);

      // Retrieve past events that match the filter and have a `target` that is equal to the expected value
      const lastBlock = await ethProvider.getBlockNumber();
      const blockChunk = networkManager.get("blockChunk");

      const txExecutionLogs = (
        await Promise.all(
          Array.from({
            length: Math.ceil(networkManager.get("pastBlocks") / blockChunk),
          }).map(async (_, idx) => {
            const fromBlock = Math.max(lastBlock - blockChunk * (idx + 1) + 1, 0);
            return await ethProvider.getLogs({
              ...timeLockContract.filters.ExecuteTransaction(null, fxRoot),
              fromBlock,
              // toBlock: Math.min(fromBlock + blockChunk - 1, lastBlock),
              toBlock: lastBlock - blockChunk * idx,
            });
          })
        )
      ).flat();

      let eventFound = false;
      for (const log of txExecutionLogs) {
        const decodedEvent = EXECUTE_TX_IFACE.decodeEventLog("ExecuteTransaction", log.data, log.topics);

        const callDataFromEvent =
          decodedEvent.signature === "" ? decodedEvent.data : encodePacked(decodedEvent.signature, decodedEvent.data);

        if (callDataFromEvent === calldata) {
          eventFound = true;
          findings.push(ProposalCreatedFinding(proposalLog, networkManager.getNetwork(), log.transactionHash));
          break;
        }
      }

      if (!eventFound) findings.push(SuspiciousProposalCreatedFinding(proposalLog, networkManager.getNetwork()));
    }

    return findings;
  };
};

const provider = getEthersBatchProvider();
const ethProvider = new ethers.providers.JsonRpcProvider(CONFIG.mainnetRpcEndpoint);

export default {
  initialize: provideInitialize(networkManager, provider),
  handleTransaction: provideHandleTransaction(networkManager, provider, ethProvider),
};
