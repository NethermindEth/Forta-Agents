import { providers } from "ethers";
import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getEthersProvider,
} from "forta-agent";
import NetworkManager, { NETWORK_MAP } from "./network";
import NetworkData from "./network";

export const MONITORED_EVENTS = [
  "event LogGlobalConfigurationRegistered(bytes32 configHash)",
  "event LogGlobalConfigurationApplied(bytes32 configHash)",
  "event LogGlobalConfigurationRemoved(bytes32 configHash)",
];

const networkManager: NetworkData = new NetworkManager(NETWORK_MAP);

const provideInitialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export const provideHandleTransaction = (networkManager: NetworkData): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // Listen to the monitored events and generate findings for each.
    txEvent.filterLog(MONITORED_EVENTS, networkManager.perpetualProxy).forEach((log) => {
      const description =
        log.name === "LogGlobalConfigurationRegistered"
          ? "registered"
          : "LogGlobalConfigurationApplied"
          ? "applied"
          : "removed";

      const alertId =
        log.name === "LogGlobalConfigurationRegistered"
          ? "DYDX-3-1"
          : "LogGlobalConfigurationApplied"
          ? "DYDX-3-2"
          : "DYDX-3-3";

      findings.push(
        Finding.fromObject({
          name: `A global configuration hash has been ${description}`,
          description: `${log.name} event emitted on perpetual contract`,
          alertId: alertId,
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "DYDX",
          metadata: {
            configHash: log.args.configHash,
          },
        })
      );
    });

    return findings;
  };
};

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
