import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { providers } from "ethers";
import NetworkData from "./network";
import NetworkManager from "./network";
import utils from "./utils";
import abi from "./abi";

const networkManager = new NetworkManager();

export const initialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export const provideHandleTransaction =
  (contractAddress: NetworkData): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const functionCalls = txEvent.filterFunction(abi.CAKE_ABI, contractAddress.masterChef);

    functionCalls.forEach((functionCall) => {
      findings.push(utils.createFinding(functionCall));
    });

    return findings;
  };

export default {
  initialize: initialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
