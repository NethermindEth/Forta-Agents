export interface NetworkData {
  bridgeReceiverAddress: string;
}

export type AgentConfig = Record<number, NetworkData>;
