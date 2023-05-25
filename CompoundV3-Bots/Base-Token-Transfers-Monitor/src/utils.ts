export interface NetworkData {
  cometContracts: CometData[];
}

export type AgentConfig = Record<number, NetworkData>;

export type CometData = { address: string; baseToken: string };
