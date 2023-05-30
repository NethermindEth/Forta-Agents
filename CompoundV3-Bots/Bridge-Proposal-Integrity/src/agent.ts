import { Finding, Initialize, HandleTransaction, TransactionEvent, ethers, getEthersBatchProvider } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import CONFIG from "./agent.config";
import { NetworkData, encodePacked, getPastEventLogs } from "./utils";
import {
  EXECUTE_TX_ABI,
  FX_CHILD_ABI,
  FX_ROOT_ABI,
  PROPOSAL_EVENT_ABI,
  SEND_MESSAGE_ABI,
  TIMELOCK_ABI,
} from "./constants";
import { createProposalCreatedFinding, createSuspiciouscreateProposalCreatedFinding } from "./finding";

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

    const proposalLogs = txEvent.filterLog(PROPOSAL_EVENT_ABI, networkManager.get("bridgeReceiverAddress"));

    if (!proposalLogs.length) return findings;

    const bridgeReceiver: ethers.Contract = new ethers.Contract(
      networkManager.get("bridgeReceiverAddress"),
      [FX_CHILD_ABI, TIMELOCK_ABI],
      provider
    );

    // fetch mainnet Timelock contract and FxRoot
    const [fxChildAddress, govTimelockAddress] = await Promise.all([
      bridgeReceiver.fxChild({ blockTag: txEvent.blockNumber }),
      bridgeReceiver.govTimelock({ blockTag: txEvent.blockNumber }),
    ]);

    const fxChild = new ethers.Contract(fxChildAddress, [FX_ROOT_ABI], provider);
    const fxRoot = ethers.utils.getAddress(await fxChild.fxRoot({ blockTag: txEvent.blockNumber }));

    for (const proposalLog of proposalLogs) {
      // encode bridged message
      const data = ethers.utils.defaultAbiCoder.encode(
        ["address[]", "uint256[]", "string[]", "bytes[]"],
        [proposalLog.args.targets, proposalLog.args[3], proposalLog.args.signatures, proposalLog.args.calldatas]
      );

      const calldata = SEND_MESSAGE_IFACE.encodeFunctionData("sendMessageToChild", [
        networkManager.get("bridgeReceiverAddress"),
        data,
      ]);

      const govTimelock = new ethers.Contract(govTimelockAddress, EXECUTE_TX_IFACE, ethProvider);

      // Retrieve past events that match the filter and have a `target` that is equal to the expected value
      const lastBlock = await ethProvider.getBlockNumber();

      const txExecutionLogs = await getPastEventLogs(
        govTimelock.filters.ExecuteTransaction(null, fxRoot),
        lastBlock,
        networkManager.get("messagePassFetchingBlockRange"),
        networkManager.get("messagePassFetchingBlockStep"),
        ethProvider
      );

      let eventFound = false;
      for (const log of txExecutionLogs) {
        const decodedEvent = EXECUTE_TX_IFACE.decodeEventLog("ExecuteTransaction", log.data, log.topics);

        const callDataFromEvent =
          decodedEvent.signature === "" ? decodedEvent.data : encodePacked(decodedEvent.signature, decodedEvent.data);

        if (callDataFromEvent === calldata) {
          eventFound = true;
          findings.push(createProposalCreatedFinding(proposalLog, networkManager.getNetwork(), log.transactionHash));
          break;
        }
      }

      if (!eventFound)
        findings.push(createSuspiciouscreateProposalCreatedFinding(proposalLog, networkManager.getNetwork()));
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
