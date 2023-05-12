export interface NetworkData {
  cometAddresses: string[];
  bridgeReceiverAddress: string;
}

export type AgentConfig = Record<number, NetworkData>;
