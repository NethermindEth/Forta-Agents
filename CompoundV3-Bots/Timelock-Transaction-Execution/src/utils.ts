export interface NetworkData {
  bridgeReceiverAddress: string;
  creationFetchingBlockRange: number;
  creationFetchingBlockStep: number;
}

export type AgentConfig = Record<number, NetworkData>;
