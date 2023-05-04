export interface NetworkData {
  cometAddresses: string[];
  baseTokens: string[];
}

export type AgentConfig = Record<number, NetworkData>;

export type TransferLog = {
  from: string;
  index: number;
  amount: number | string;
};
