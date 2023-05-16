export interface NetworkData {
  cometAddresses: string[];
  alertInterval: number;
}

export interface AgentState {
  alertedAt: { [address: string]: number };
}

export type AgentConfig = Record<number, NetworkData>;
