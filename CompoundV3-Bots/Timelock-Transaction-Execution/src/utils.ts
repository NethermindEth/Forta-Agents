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
  txValues: ethers.BigNumber[];
  signatures: string[];
  calldatas: string[];
  eta: ethers.BigNumber;
}

function rangeChunks(from: number, to: number, chunkSize: number): Array<[from: number, to: number]> {
  const resp: Array<[from: number, to: number]> = [];

  for (let i = from; i <= to; i += chunkSize) {
    resp.push([i, Math.min(i + chunkSize - 1, to)]);
  }

  return resp;
}

export function pastBlockChunks(
  fromBlock: number,
  blockRange: number,
  chunkSize: number
): Array<[from: number, to: number]> {
  return rangeChunks(Math.max(fromBlock - blockRange + 1, 0), fromBlock, chunkSize);
}

export function getPastEventLogs(
  filter: ethers.EventFilter,
  fromBlock: number,
  blockRange: number,
  blockStep: number,
  provider: ethers.providers.Provider
) {
  const chunks = pastBlockChunks(fromBlock, blockRange, blockStep);

  const logs = Promise.all(
    chunks.map(([from, to]) =>
      provider.getLogs({
        ...filter,
        fromBlock: from,
        toBlock: to,
      })
    )
  );

  return logs.then((logs) => logs.flat());
}
