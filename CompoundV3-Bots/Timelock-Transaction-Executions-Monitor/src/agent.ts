import { ethers, Finding, getEthersBatchProvider, Initialize, HandleTransaction, TransactionEvent } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import CONFIG from "./agent.config";
import { LOCAL_TIMELOCK_ABI, EXECUTE_TRANSACTION_ABI, PROPOSAL_EXECUTED_ABI, PROPOSAL_CREATED_ABI } from "./constants";
import {
  createSuccessfulProposalExecutionFinding,
  createUnsuccessfulProposalExecutionFinding,
  createUnknownTimelockExecutionFinding,
} from "./finding";
import { ExecuteTransactionArgs, NetworkData, ProposalCreatedArgs, getPastEventLogs } from "./utils";

const networkManager = new NetworkManager(CONFIG);

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
  provider: ethers.providers.Provider
): HandleTransaction => {
  const bridgeReceiverIface = new ethers.utils.Interface([LOCAL_TIMELOCK_ABI, PROPOSAL_CREATED_ABI]);

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const executeTransactionLogs = txEvent.filterLog(EXECUTE_TRANSACTION_ABI);

    if (!executeTransactionLogs.length) {
      return [];
    }

    const findings: Finding[] = [];
    const chainId = networkManager.getNetwork();
    const block = txEvent.blockNumber;

    const creationFetchingBlockRange = networkManager.get("creationFetchingBlockRange");
    const creationFetchingBlockStep = networkManager.get("creationFetchingBlockStep");
    const bridgeReceiver = new ethers.Contract(
      networkManager.get("bridgeReceiverAddress"),
      bridgeReceiverIface,
      provider
    );
    const timelockAddress = await bridgeReceiver.localTimelock({ blockTag: block });

    // Filter ExecuteTransaction logs from the local timelock and ProposalExecuted logs from the bridge receiver
    const timelockExecutionLogs = executeTransactionLogs.filter(
      (el) => el.address.toLowerCase() === timelockAddress.toLowerCase()
    );
    const proposalExecutedLogs = txEvent.filterLog(PROPOSAL_EXECUTED_ABI, bridgeReceiver.address);

    if (!timelockExecutionLogs.length && !proposalExecutedLogs.length) {
      return [];
    }

    // Tries fetching past ProposalCreated events to get proposal calls
    const proposalCreationInfos = (
      await getPastEventLogs(
        bridgeReceiver.filters.ProposalCreated(),
        block,
        creationFetchingBlockRange,
        creationFetchingBlockStep,
        provider
      )
    ).map((log) => bridgeReceiverIface.parseLog(log).args) as unknown as Array<ProposalCreatedArgs>;

    // Processes the above data into a better format for matching, and checks whether any proposal creation
    // event was missed (edge case)
    const missedProposalIds: ethers.BigNumber[] = [];
    const executedProposalInfos = proposalExecutedLogs.map((log) => {
      const creationInfo = proposalCreationInfos.find((el) => el.id.eq(log.args.id));

      if (!creationInfo) {
        missedProposalIds.push(log.args.id);
        return undefined;
      }

      return {
        id: creationInfo.id,
        calls: creationInfo.targets.map((_, idx) => ({
          matched: false,
          target: creationInfo.targets[idx],
          value: creationInfo.txValues[idx],
          signature: creationInfo.signatures[idx],
          data: creationInfo.calldatas[idx],
        })),
        eta: creationInfo.eta,
      };
    });

    if (missedProposalIds.length) {
      console.warn(
        "Current creationFetchingBlockRange parameter is too low, so some proposal creations couldnt'be fetched. Please consider increasing it."
      );
      console.warn(`Missed proposal IDs: ${missedProposalIds.map((id) => id.toString()).join(", ")}`);
    }

    const timelockExecutionInfos = timelockExecutionLogs.map((log) => ({
      matched: false,
      ...log.args,
    })) as unknown as Array<ExecuteTransactionArgs & { matched: boolean }>;

    // Matches proposal calls with executed calls
    timelockExecutionInfos.forEach((callExecution) => {
      for (const proposalExecution of executedProposalInfos) {
        if (!proposalExecution || !proposalExecution.eta.eq(callExecution.eta)) {
          continue;
        }

        const matchingCall = proposalExecution?.calls.find((call) => {
          return (
            call.target.toLowerCase() === callExecution.target.toLowerCase() &&
            call.value.eq(callExecution.value) &&
            call.signature === callExecution.signature &&
            call.data === callExecution.data
          );
        });

        if (matchingCall) {
          matchingCall.matched = true;
          callExecution.matched = true;
          break;
        }
      }
    });

    executedProposalInfos.forEach((proposalExecution) => {
      if (!proposalExecution) return;

      if (proposalExecution.calls.some((call) => !call.matched)) {
        findings.push(
          createUnsuccessfulProposalExecutionFinding(
            bridgeReceiver.address,
            timelockAddress,
            proposalExecution.id,
            chainId
          )
        );
      } else {
        findings.push(
          createSuccessfulProposalExecutionFinding(
            bridgeReceiver.address,
            timelockAddress,
            proposalExecution.id,
            chainId
          )
        );
      }
    });

    timelockExecutionInfos.forEach((callExecution) => {
      if (!callExecution.matched) {
        findings.push(
          createUnknownTimelockExecutionFinding(
            bridgeReceiver.address,
            timelockAddress,
            callExecution.txHash,
            callExecution.target,
            callExecution.value,
            callExecution.signature,
            callExecution.data,
            callExecution.eta,
            chainId
          )
        );
      }
    });

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersBatchProvider()),
  handleTransaction: provideHandleTransaction(networkManager, getEthersBatchProvider()),
};
