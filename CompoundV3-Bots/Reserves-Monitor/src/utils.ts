export interface NetworkData {
  cometAddresses: string[]; // List of comet contract adddresses for each network.
  alertFrequency: number; // Frequency of emitting alerts for the same contract.
}

export interface AgentState {
  alerts: { [address: string]: number };
}

export type AgentConfig = Record<number, NetworkData>;
