import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  LogDescription,
  getEthersProvider,
} from "forta-agent";
import { providers } from "ethers";
import { EVENTS_ABI } from "./utils";
import { createFinding } from "./finding";
import NetworkData from "./network";
import NetworkManager, { NETWORK_MAP } from "./network";

const networkManager: NetworkData = new NetworkManager(NETWORK_MAP);

export const provideInitialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export const provideHandleTransaction =
  (networkManager: NetworkData): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const logs: LogDescription[] = txEvent.filterLog(EVENTS_ABI, [
      networkManager.banana,
      networkManager.gnana,
    ]);

    logs.forEach((log) => findings.push(createFinding(log, networkManager)));

    return findings;
  };

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
