import { Finding, HandleTransaction, TransactionEvent, Initialize, getEthersProvider } from "forta-agent";
import { AgentConfig, PAUSE_EVENTS_ABIS, NetworkData } from "./utils";
import { providers } from "ethers";
import { NetworkManager } from "forta-agent-tools";
import { createFinding } from "./finding";
import CONFIG from "./agent.config";

const networkManager = new NetworkManager<NetworkData>(CONFIG);

const provideInitialize = (networkManager: NetworkManager<NetworkData>, provider: providers.Provider): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};

export const provideHandleTransaction = (networkManager: NetworkManager<NetworkData>): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    txEvent.filterLog(PAUSE_EVENTS_ABIS, networkManager.get("compoundComptrollerAddress")).forEach((log) => {
      findings.push(createFinding(log));
    });

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
