import { ethers } from "forta-agent";
import BigNumber from "bignumber.js";

export interface NetworkData {
  vaultAddress: string;
  threshold: string;
}

export type AgentConfig = Record<number, NetworkData>;

export const toBn = (ethersBn: ethers.BigNumber) => new BigNumber(ethersBn.toString());
