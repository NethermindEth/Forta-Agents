import { HandleTransaction, TransactionEvent, getEthersProvider, ethers, Initialize, Finding } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { provideHandleTransaction as eventsProvideHandleTransaction } from "./events.listener";
import { provideHandleTransaction as functionProvideHandleTransaction } from "./function.call.listener";
import { NetworkData, DATA } from "./config";

const networkManager = new NetworkManager(DATA);

export const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};
export const provideHandleTransaction = (networkManager: NetworkManager<NetworkData>): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const cakeVaultAddress = networkManager.get("cakeVaultAddress");

    const eventsBotHandleTransaction = eventsProvideHandleTransaction(cakeVaultAddress);
    const functionCallBotHandleTransaction = functionProvideHandleTransaction(cakeVaultAddress);

    const findings = (
      await Promise.all([eventsBotHandleTransaction(txEvent), functionCallBotHandleTransaction(txEvent)])
    ).flat();
    return findings;
  };
};
export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
