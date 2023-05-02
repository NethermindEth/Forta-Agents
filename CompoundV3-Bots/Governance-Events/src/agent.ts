import { ethers, Finding, getEthersProvider, Initialize, HandleTransaction, TransactionEvent } from "forta-agent";
import CONFIG from "./agent.config";
import { createApproveFinding, createPauseActionFinding, createWithdrawReservesFinding } from "./finding";
import { NetworkData } from "./utils";
import { NetworkManager } from "forta-agent-tools";
import { APPROVAL_ABI, PAUSE_ACTION_ABI, WITHDRAW_RESERVES_ABI } from "./constants";

const networkManager = new NetworkManager(CONFIG);

export const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};

export const provideHandleTransaction = (networkManager: NetworkManager<NetworkData>): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const chainId = networkManager.getNetwork();

    const pauseLogs = txEvent.filterLog(PAUSE_ACTION_ABI, networkManager.get("cometAddresses"));
    pauseLogs.forEach((log) => findings.push(createPauseActionFinding(log, chainId)));

    const withdrawLogs = txEvent.filterLog(WITHDRAW_RESERVES_ABI, networkManager.get("cometAddresses"));
    withdrawLogs.forEach((log) => findings.push(createWithdrawReservesFinding(log, chainId)));

    const approvalLogs = txEvent.filterLog(APPROVAL_ABI);
    approvalLogs
      .filter((log) =>
        networkManager
          .get("cometAddresses")
          .find((cometAddress) => cometAddress.toLowerCase() === log.args.owner.toLowerCase())
      )
      .forEach((log) => findings.push(createApproveFinding(log, chainId)));

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
