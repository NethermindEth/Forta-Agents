import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { providers } from "ethers";
import NetworkData from "./network";
import NetworkManager, { NETWORK_MAP } from "./network";
import { EVENTS } from "./utils";
import { createFinding } from "./findings";

const networkManager = new NetworkManager(NETWORK_MAP);

export const provideInitialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export function provideHandleTransaction(networkManager: NetworkData): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // If any of the desired events are emitted by either
    // the Safety Module or Liquidity Module contracts,
    // create a finding
    txEvent.filterLog(EVENTS, [networkManager.safetyModule, networkManager.liquidityModule]).map((log) => {
      findings.push(createFinding(log.name, log.args, log.address));
    });

    return findings;
  };
}

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
