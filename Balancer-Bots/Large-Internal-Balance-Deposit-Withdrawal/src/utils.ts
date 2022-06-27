export interface NetworkData {
  vaultAddress: string;
  threshold: string;
}

export type AgentConfig = Record<number, NetworkData>;
