import { Provider } from "@ethersproject/providers";
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

export const EVENTS_SIGNATURES = ["event LogFrozen()", "event LogUnFrozen()"];
const networkManager: NetworkData = new NetworkManager(NETWORK_MAP);

const provideInitialize = (provider: Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export const provideHandleTransaction = (networkManager: NetworkData): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // Listen to `LogFrozen` `LogUnFrozen` events and generate findings for each.
    txEvent.filterLog(EVENTS_SIGNATURES, networkManager.perpetualProxy).forEach((log) => {
      const description = log.name === "LogFrozen" ? "Frozen" : "UnFrozen";
      const alertId = log.name === "LogFrozen" ? "DYDX-2-1" : "DYDX-2-2";

      findings.push(
        Finding.fromObject({
          name: `Perpetual exchange contract is ${description}`,
          description: `${log.name} event emitted on perpetual contract`,
          alertId: alertId,
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "dYdX",
          metadata: {
            from: txEvent.from,
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
