import { ethers } from "ethers";

export interface NetworkData {
  cometAddresses: string[];
  alertInterval: number;
}

export interface AgentState {
  cometContracts: Record<string, ethers.Contract>;
  alertedAt: Record<string, number>;
}

export type AgentConfig = Record<number, NetworkData>;
