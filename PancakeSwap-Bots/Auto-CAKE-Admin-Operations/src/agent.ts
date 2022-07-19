import { HandleTransaction, TransactionEvent, getEthersProvider, ethers, Initialize, Finding } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import eventsBot from "./events.listener";
import functionCallBot from "./function.call.listener";
import { NetworkData, DATA } from "./config";

const networkManager = new NetworkManager(DATA);

const provideInitialize = (
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): Initialize => {
  return async () => {
    await networkManager.init(provider);
  };
};
const provideHandleTransaction = (networkManager: NetworkManager<NetworkData>): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const cakeVaultAddress = networkManager.get("cakeVaultAddress");

    const eventsBotHandleTransaction = eventsBot.provideHandleTransaction(cakeVaultAddress);
    const functionCallBotHandleTransaction = functionCallBot.provideHandleTransaction(cakeVaultAddress);

    const findings = (
      await Promise.all([eventsBotHandleTransaction(txEvent), functionCallBotHandleTransaction(txEvent)])
    ).flat();
    return findings;
  };
};
export default {
  provideHandleTransaction,
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
