import { BlockEvent, ethers, Finding, getEthersProvider, HandleBlock } from "forta-agent";
import CONFIG from "./agent.config";
import { POOL_REGISTERED_ABI } from "./constants";
import { createFinding } from "./finding";
import { AgentConfig } from "./utils";

export const provideHandleBlock = (config: AgentConfig, provider: ethers.providers.Provider): HandleBlock => {
  const vaultIface = new ethers.utils.Interface([POOL_REGISTERED_ABI]);
  const topics = [vaultIface.getEventTopic("PoolRegistered")];

  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const logs = (
      await provider.getLogs({
        address: config.vaultAddress,
        topics,
        fromBlock: blockEvent.blockNumber,
        toBlock: blockEvent.blockNumber,
      })
    ).map((log) => vaultIface.parseLog(log));

    return logs.map((log) => createFinding(log));
  };
};

export default {
  handleBlock: provideHandleBlock(CONFIG, getEthersProvider()),
};
