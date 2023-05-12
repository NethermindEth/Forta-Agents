import {
  Finding,
  Initialize,
  HandleTransaction,
  TransactionEvent,
  ethers,
  getEthersProvider,
} from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import CONFIG from "./agent.config";
import { NetworkData, encodePacked } from "./utils";
import {
  EXECUTE_TX_ABI,
  PROPOSAL_EVENT_ABI,
  SEND_MESSAGE_ABI,
} from "./constants";
import { Interface, getAddress } from "ethers/lib/utils";
import {
  ProposalCreatedFinding,
  SuspiciousProposalCreatedFinding,
} from "./finding";

const networkManager = new NetworkManager(CONFIG);
const SEND_MESSAGE_IFACE = new Interface([SEND_MESSAGE_ABI]);
const EXECUTE_TX_IFACE = new Interface([EXECUTE_TX_ABI]);

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
  provider?: ethers.providers.Provider
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const abi = ethers.utils.defaultAbiCoder;
    const mainnetProvider = provider
      ? provider
      : new ethers.providers.JsonRpcProvider(networkManager.get("rpcEndpoint"));

    // Listen to ProposalCreated events on BaseBridgeReciever contract
    const proposalLogs = txEvent.filterLog(
      PROPOSAL_EVENT_ABI,
      networkManager.get("bridgeReceiver")
    );

    for (let proposalLog of proposalLogs) {
      const data = abi.encode(
        ["address[]", "uint256[]", "string[]", "bytes[]"],
        [
          proposalLog.args.targets,
          proposalLog.args[3],
          proposalLog.args.signatures,
          proposalLog.args.calldatas,
        ]
      );

      // Encode call to sendMessageToChild
      const calldata = SEND_MESSAGE_IFACE.encodeFunctionData(
        "sendMessageToChild",
        [networkManager.get("bridgeReceiver"), data]
      );

      const timeLockContract = new ethers.Contract(
        networkManager.get("timeLock"),
        EXECUTE_TX_IFACE,
        mainnetProvider
      );

      // ExecuteTransaction event filter
      const eventFilter = timeLockContract.filters.ExecuteTransaction(
        null,
        getAddress(networkManager.get("fxRoot"))
      );

      // Retrieve past events that match the filter and have a `target` that is equal to the expected value
      const lastBlock = await mainnetProvider.getBlockNumber();
      const blockChunk = networkManager.get("blockChunk");

      const txExecutionLogs = (
        await Promise.all(
          Array.from({
            length: Math.ceil(networkManager.get("pastBlocks") / blockChunk),
          }).map(async (_, idx) => {
            const fromBlock = Math.max(
              lastBlock - blockChunk * (idx + 1) + 1,
              0
            );
            return await mainnetProvider.getLogs({
              ...eventFilter,
              fromBlock,
              // toBlock: Math.min(fromBlock + blockChunk - 1, lastBlock),
              toBlock: lastBlock - blockChunk * idx,
            });
          })
        )
      ).flat();

      let eventFound = false;
      for (let log of txExecutionLogs) {
        let decodedEvent = EXECUTE_TX_IFACE.decodeEventLog(
          "ExecuteTransaction",
          log.data,
          log.topics
        );

        let callDataFromEvent =
          decodedEvent.signature === ""
            ? decodedEvent.data
            : encodePacked(decodedEvent.signature, decodedEvent.data);

        if (callDataFromEvent === calldata) {
          eventFound = true;
          findings.push(
            ProposalCreatedFinding(
              proposalLog,
              networkManager.getNetwork().toString(),
              log.transactionHash
            )
          );
          break;
        }
      }

      if (!eventFound)
        findings.push(
          SuspiciousProposalCreatedFinding(
            proposalLog,
            networkManager.getNetwork().toString()
          )
        );
    }
    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
