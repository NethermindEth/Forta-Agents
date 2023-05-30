import { ethers } from "ethers";

export interface NetworkData {
  bridgeReceiverAddress: string;
  messagePassFetchingBlockStep: number;
  messagePassFetchingBlockRange: number;
}

export interface AgentConfig {
  mainnetRpcEndpoint: string;
  networkData: Record<number, NetworkData>;
}

export function encodePacked(signature: string, data: string): string {
  const signatureHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(signature));
  const calldata = ethers.utils.hexConcat([signatureHash.slice(0, 10), ethers.utils.hexlify(data)]);
  return calldata;
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

export async function getPastEventLogs(
  filter: ethers.EventFilter,
  fromBlock: number,
  blockRange: number,
  blockStep: number,
  provider: ethers.providers.Provider
) {
  const chunks = pastBlockChunks(fromBlock, blockRange, blockStep);

  const logs = await Promise.all(
    chunks.map(([from, to]) =>
      provider.getLogs({
        ...filter,
        fromBlock: from,
        toBlock: to,
      })
    )
  );

  return logs.flat();
}
