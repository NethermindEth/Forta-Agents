import { ethers } from "ethers";

export interface NetworkData {
  cometAddresses: string[];
  alertInterval: number;
}

export interface AgentState {
  cometContracts: { [address: string]: ethers.Contract };
  alertedAt: { [address: string]: number };
}

export type AgentConfig = Record<number, NetworkData>;
