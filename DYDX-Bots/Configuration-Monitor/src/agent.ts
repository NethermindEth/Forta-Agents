import { providers } from "ethers";
import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getEthersProvider,
} from "forta-agent";
import AddressProvider from "./address.provider";

export const MONITORED_EVENTS = [
  "event LogGlobalConfigurationRegistered(bytes32 configHash)",
  "event LogGlobalConfigurationApplied(bytes32 configHash)",
  "event LogGlobalConfigurationRemoved(bytes32 configHash)",
];
const PERPETUAL_PROXY = "0xD54f502e184B6B739d7D27a6410a67dc462D69c8";
const TEST_PROXY = "0xcd8fa8342d779f8d6acc564b73746bf9ca1261c6";
let addressProvider: AddressProvider = new AddressProvider(PERPETUAL_PROXY, TEST_PROXY);

const initialize = (provider: providers.Provider) => async () => {
  const networkId = (await provider.getNetwork()).chainId;
  addressProvider.setNetwork(networkId.toString());
};

export const provideHandleTransaction = (provider: AddressProvider): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // get the monitored contract address based on the chainId.
    const perpetualAddress = provider.getAddress();

    // Listen to the monitored events and generate findings for each.
    txEvent.filterLog(MONITORED_EVENTS, perpetualAddress).forEach((log) => {
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
  initialize: initialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(addressProvider),
};
