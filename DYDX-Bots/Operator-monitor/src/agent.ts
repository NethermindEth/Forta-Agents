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
  "event LogOperatorAdded(address operator)",
  "event LogOperatorRemoved(address operator)",
];

const networkManager: NetworkData = new NetworkManager(NETWORK_MAP);

const initialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export const provideHandleTransaction = (networkManager: NetworkData): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // Listen to `LogOperatorAdded` `LogOperatorRemoved` events and generate findings for each.
    txEvent.filterLog(MONITORED_EVENTS, networkManager.perpetualProxy).forEach((log) => {
      const description = log.name === "LogOperatorAdded" ? "added to" : "removed from";
      const alertId = log.name === "LogOperatorAdded" ? "DYDX-4-1" : "DYDX-4-2";

      findings.push(
        Finding.fromObject({
          name: `An operator has been ${description} dydx perpetual exchange.`,
          description: `${log.name} event emitted on perpetual contract`,
          alertId: alertId,
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "DYDX",
          metadata: {
            operator: log.args.operator.toLowerCase(),
          },
        })
      );
    });

    return findings;
  };
};

export default {
  initialize: initialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
