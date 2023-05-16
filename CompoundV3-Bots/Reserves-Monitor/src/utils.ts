export interface NetworkData {
  cometAddresses: string[];
  alertFrequency: number;
}

export interface AgentState {
  alertedAt: { [address: string]: number };
}

export type AgentConfig = Record<number, NetworkData>;
