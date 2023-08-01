import { ethers, Finding, getEthersProvider, Initialize, HandleTransaction, TransactionEvent } from "forta-agent";
import CONFIG from "./agent.config";
import { createApproveThisFinding, createPauseActionFinding, createWithdrawReservesFinding } from "./finding";
import { NetworkData } from "./utils";
import { NetworkManager } from "forta-agent-tools";
import { APPROVE_THIS_ABI, EXECUTE_TRANSACTION_ABI, PAUSE_ACTION_ABI, WITHDRAW_RESERVES_ABI } from "./constants";

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
  const approveThisIface = new ethers.utils.Interface([APPROVE_THIS_ABI]);

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const chainId = networkManager.getNetwork();
    const cometContracts = networkManager.get("cometContracts");
    const cometAddresses = cometContracts.map((entry) => entry.address);
    const cometTimelockAddresses = cometContracts.map((entry) => entry.timelockGovernorAddress);

    const pauseLogs = txEvent.filterLog(PAUSE_ACTION_ABI, cometAddresses);
    pauseLogs.forEach((log) => findings.push(createPauseActionFinding(log, chainId)));

    const withdrawLogs = txEvent.filterLog(WITHDRAW_RESERVES_ABI, cometAddresses);
    withdrawLogs.forEach((log) => findings.push(createWithdrawReservesFinding(log, chainId)));

    const approveThisExecutionLogs = txEvent.filterLog(EXECUTE_TRANSACTION_ABI, cometTimelockAddresses);
    approveThisExecutionLogs
      .filter(
        (log) =>
          cometAddresses.find((cometAddress) => cometAddress.toLowerCase() === log.args.target.toLowerCase()) &&
          log.args.signature === approveThisIface.getFunction("approveThis").format("sighash")
      )
      .forEach((log) => {
        const callArgs = approveThisIface.decodeFunctionData(
          "approveThis",
          ethers.utils.hexConcat([approveThisIface.getSighash("approveThis"), log.args.data])
        );

        findings.push(
          createApproveThisFinding(
            log.address,
            log.args.target,
            callArgs.asset,
            callArgs.manager,
            callArgs.amount,
            chainId
          )
        );
      });

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
