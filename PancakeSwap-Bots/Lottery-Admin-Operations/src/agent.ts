import { HandleTransaction, TransactionEvent, getEthersProvider, ethers, Initialize, Finding } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import newGeneratorBot from "./new.random.generator";
import newOperatorBot from "./new.operator.and.treasury.and.injector.address";
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

    const lotteryAddress = networkManager.get("lotteryAddress");

    const newGeneratorBotHandleTransaction = newGeneratorBot.providerHandleTransaction(lotteryAddress);
    const newOperatorBotHandleTransaction = newOperatorBot.providerHandleTransaction(lotteryAddress);
    const functionCallBotHandleTransaction = functionCallBot.providerHandleTransaction(lotteryAddress);

    const findings = (
      await Promise.all([
        newGeneratorBotHandleTransaction(txEvent),
        newOperatorBotHandleTransaction(txEvent),
        functionCallBotHandleTransaction(txEvent),
      ])
    ).flat();
    return findings;
  };
};
export default {
  provideHandleTransaction,
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
