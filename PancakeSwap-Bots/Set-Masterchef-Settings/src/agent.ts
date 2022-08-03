import { Finding, HandleTransaction, TransactionEvent, getEthersProvider, Initialize, ethers} from "forta-agent";
import utils from "./utils";
import abi from "./abi";
import { NetworkManager } from "forta-agent-tools";
import CONFIG  from "./network";
import { NetworkData } from "./network";

const networkManager = new NetworkManager<NetworkData>(CONFIG);

export const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};

export const provideHandleTransaction =
  (networkManager: NetworkManager<NetworkData>): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const functionCalls = txEvent.filterFunction(abi.CAKE_ABI, networkManager.get("masterChef"));

    functionCalls.forEach((functionCall) => {
      findings.push(utils.createFinding(functionCall));
    });

    return findings;
  };

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};