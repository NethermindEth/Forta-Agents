import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { providers } from "ethers";
import NetworkData from "./network";
import NetworkManager from "./network";
import utils from "./utils";

const networkManager = new NetworkManager();

export const initialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export const handleTransaction =
  (contractAddress: NetworkData): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const functionCalls = txEvent.filterFunction(utils.FUNCTIONS_ABI, contractAddress.factory);

    functionCalls.forEach((functionCall) => {
      findings.push(utils.createFinding(functionCall, contractAddress));
    });

    return findings;
  };

export default {
  initialize: initialize(getEthersProvider()),
  handleTransaction: handleTransaction(networkManager),
};
