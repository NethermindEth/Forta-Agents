export interface NetworkData {
  cometAddresses: string[];
  alertFrequency: number;
}

export interface AgentState {
  alerts: { [address: string]: number };
}

export type AgentConfig = Record<number, NetworkData>;
