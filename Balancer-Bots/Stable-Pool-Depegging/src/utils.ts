import { ethers } from "forta-agent";
import BigNumber from "bignumber.js";
import { NetworkManager } from "forta-agent-tools";
import { AMP_UPDATE_STARTED_ABI } from "./constants";

export interface NetworkData {
  stablePoolAddresses: string[];
  valueThreshold?: string;
  decreaseThreshold?: string;
  decreasePercentageThreshold?: string;
}

export const toBn = (ethersBn: ethers.BigNumber) => new BigNumber(ethersBn.toString());

export type GetAmpUpdateStartedLog = (
  blockNumber: number
) => Promise<(ethers.utils.LogDescription & { emitter: string })[]>;

export function provideGetAmpUpdateStartedLogs(
  networkManager: NetworkManager<NetworkData>,
  provider: ethers.providers.Provider
): GetAmpUpdateStartedLog {
  const stablePoolIface = new ethers.utils.Interface([AMP_UPDATE_STARTED_ABI]);
  const topics = [stablePoolIface.getEventTopic("AmpUpdateStarted")];

  return async (blockNumber: number) => {
    const encodedLogs = await provider.getLogs({
      topics,
      fromBlock: blockNumber,
      toBlock: blockNumber,
    });

    const stablePoolAddresses = networkManager.get("stablePoolAddresses");

    return encodedLogs
      .filter((log) => stablePoolAddresses.some((address) => address.toLowerCase() === log.address.toLowerCase()))
      .map((log) => ({ ...stablePoolIface.parseLog(log), emitter: log.address }));
  };
}

export type AgentConfig = Record<number, NetworkData>;
