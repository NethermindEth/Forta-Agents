import { ethers } from "forta-agent";
import BigNumber from "bignumber.js";

export interface NetworkData {
  stablePoolAddresses: string[];
  absoluteThreshold?: string;
  percentageThreshold?: string;
}

export const toBn = (ethersBn: ethers.BigNumber) => new BigNumber(ethersBn.toString());

export type AgentConfig = Record<number, NetworkData>;
