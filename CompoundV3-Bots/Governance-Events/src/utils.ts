export interface NetworkData {
  cometContracts: CometData[];
}

export type AgentConfig = Record<number, NetworkData>;

export interface CometData {
  address: string;
  timelockGovernorAddress: string;
}
