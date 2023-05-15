export interface NetworkData {
  cometContracts: { address: string; baseToken: string }[];
}

export type AgentConfig = Record<number, NetworkData>;

export type TransferLog = {
  from: string;
  destinationComet: { address: string; baseToken: string };
  amount: number | string;
};
