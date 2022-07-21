import { TransactionEvent, ethers, Finding, getEthersProvider, HandleTransaction, Initialize } from "forta-agent";
import CONFIG from "./agent.config";
import { FLASH_LOAN_FEE_PERCENTAGE_CHANGED_ABI, SWAP_FEE_PERCENTAGE_CHANGED_ABI } from "./constants";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData } from "./utils";
import { createFinding } from "./finding";

const networkManager = new NetworkManager<NetworkData>(CONFIG);

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
    const logs = txEvent.filterLog(
      [SWAP_FEE_PERCENTAGE_CHANGED_ABI, FLASH_LOAN_FEE_PERCENTAGE_CHANGED_ABI],
      networkManager.get("protocolFeesCollectorAddress")
    );

    if (!logs.length) return [];

    return logs.map((log) => {
      const feeFrom = log.name.replace("FeePercentageChanged", "");

      return createFinding(feeFrom as "FlashLoan" | "Swap", log.args[0]);
    });
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
