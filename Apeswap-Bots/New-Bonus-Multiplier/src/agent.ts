import { Finding, HandleTransaction, TransactionEvent, ethers, getEthersProvider } from "forta-agent";
import { UPDATE_MULTIPLIER_FUNCTION, createFinding } from "./utils";
import NetworkManager, { NetworkData } from "./network";

const networkManager = new NetworkManager();

export const initialize = (provider: ethers.providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export function provideBotHandler(address: NetworkData): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const functionInvocations = txEvent.filterFunction(UPDATE_MULTIPLIER_FUNCTION, address.masterApe);

    functionInvocations.forEach((invocation) => {
      const { args }: { args: ethers.utils.Result } = invocation;
      findings.push(createFinding(args.multiplierNumber.toString(), address.masterApe));
    });

    return findings;
  };
}

export default {
  initialize: initialize(getEthersProvider()),
  handleTransaction: provideBotHandler(networkManager),
};
