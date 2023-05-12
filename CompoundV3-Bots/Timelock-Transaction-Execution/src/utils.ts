import { ethers } from "forta-agent";

export interface NetworkData {
  bridgeReceiverAddress: string;
  creationFetchingBlockRange: number;
  creationFetchingBlockStep: number;
}

export type AgentConfig = Record<number, NetworkData>;

export interface ExecuteTransactionArgs {
  txHash: string;
  target: string;
  value: ethers.BigNumber;
  signature: string;
  data: string;
  eta: ethers.BigNumber;
}

export interface ProposalCreatedArgs {
  rootMessageSender: string;
  id: ethers.BigNumber;
  targets: string[];
  values: ethers.BigNumber[];
  signatures: string[];
  calldatas: string[];
  eta: ethers.BigNumber;
}

export function rangeChunks(from: number, to: number, chunkSize: number): Array<[from: number, to: number]> {
  const resp: Array<[from: number, to: number]> = [];

  for (let i = from; i < to; i += chunkSize) {
    resp.push([i, Math.min(i + chunkSize - 1, to)]);
  }

  return resp;
}
