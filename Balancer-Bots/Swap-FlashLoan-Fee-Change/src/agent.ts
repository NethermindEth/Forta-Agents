import { BlockEvent, ethers, Finding, getEthersProvider, HandleBlock, Initialize } from "forta-agent";
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

export const provideHandleBlock = (
  provider: ethers.providers.Provider,
  networkManager: NetworkManager<NetworkData>
): HandleBlock => {
  const protocolFeesCollectorIface = new ethers.utils.Interface([
    SWAP_FEE_PERCENTAGE_CHANGED_ABI,
    FLASH_LOAN_FEE_PERCENTAGE_CHANGED_ABI,
  ]);

  const sighashes = [
    protocolFeesCollectorIface.getEventTopic("SwapFeePercentageChanged"),
    protocolFeesCollectorIface.getEventTopic("FlashLoanFeePercentageChanged"),
  ];

  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const logs = (
      await provider.getLogs({
        address: networkManager.get("protocolFeesCollectorAddress"),
        fromBlock: blockEvent.blockNumber,
        toBlock: blockEvent.blockNumber,
        topics: [sighashes],
      })
    ).map((log) => protocolFeesCollectorIface.parseLog(log));

    return logs.map((log) => {
      const feeFrom = log.name.replace("FeePercentageChanged", "");

      return createFinding(feeFrom as "FlashLoan" | "Swap", log.args[0]);
    });
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleBlock: provideHandleBlock(getEthersProvider(), networkManager),
};
