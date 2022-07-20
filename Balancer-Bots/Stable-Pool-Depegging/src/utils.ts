import { ethers, TransactionEvent } from "forta-agent";
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
  txEvent: TransactionEvent
) => Promise<(ethers.utils.LogDescription & { emitter: string })[]>;

export function provideGetAmpUpdateStartedLogs(networkManager: NetworkManager<NetworkData>): GetAmpUpdateStartedLog {
  const stablePoolIface = new ethers.utils.Interface([AMP_UPDATE_STARTED_ABI]);

  return async (txEvent: TransactionEvent) => {
    const encodedLogs = txEvent.filterLog([AMP_UPDATE_STARTED_ABI], networkManager.get("stablePoolAddresses"));

    const stablePoolAddresses = networkManager.get("stablePoolAddresses");

    return encodedLogs
      .filter((log) => stablePoolAddresses.some((address) => address.toLowerCase() === log.address.toLowerCase()))
      .map((log) => ({ ...log, emitter: log.address }));
  };
}

export type AgentConfig = Record<number, NetworkData>;
