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
  "event LogOperatorAdded(address operator)",
  "event LogOperatorRemoved(address operator)",
];
const PERPETUAL_PROXY = "0xD54f502e184B6B739d7D27a6410a67dc462D69c8";
const TEST_PROXY = "0xCD8Fa8342D779F8D6acc564B73746bF9ca1261C6";
let addressProvider: AddressProvider = new AddressProvider(
  PERPETUAL_PROXY,
  TEST_PROXY
);

const initialize = (provider: providers.Provider) => async () => {
  const networkId = (await provider.getNetwork()).chainId;
  addressProvider.setNetwork(networkId.toString());
};

export const provideHandleTransaction = (
  provider: AddressProvider
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    // get the monitored contract address based on the chainId.
    const perpetualAddress = provider.getAddress();

    // Listen to `LogOperatorAdded` `LogOperatorRemoved` events and generate findings for each.
    txEvent.filterLog(MONITORED_EVENTS, perpetualAddress).forEach((log) => {
      const description =
        log.name === "LogOperatorAdded" ? "added to" : "removed from";
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
  handleTransaction: provideHandleTransaction(addressProvider),
};
