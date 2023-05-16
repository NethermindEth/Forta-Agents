export interface NetworkData {
  cometAddresses: string[];
}

export type AgentConfig = Record<number, NetworkData>;
