import { HandleTransaction, TransactionEvent, getEthersProvider, ethers, Initialize, Finding } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import newGeneratorBot from "./new.random.generator";
import newOperatorBot from "./new.operator.and.treasury.and.injector.address";
import functionCallBot from "./function.call.listener";

interface NetworkData {
  lotteryAddress: string;
}
const data: Record<number, NetworkData> = {
  56: {
    lotteryAddress: "0x5aF6D33DE2ccEC94efb1bDF8f92Bd58085432d2c",
  },
  97: {
    lotteryAddress: "0x1a79f536EB9E93570C30fd23Debf2a068Ea33d33",
  },
};
const networkManager = new NetworkManager(data);
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
    let lotteryAddress = networkManager.get("lotteryAddress");

    let newGeneratorBotHandleTransaction = newGeneratorBot.providerHandleTransaction(lotteryAddress);
    let newOperatorBotHandleTransaction = newOperatorBot.providerHandleTransaction(lotteryAddress);
    let functionCallBotHandleTransaction = functionCallBot.providerHandleTransaction(lotteryAddress);
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
