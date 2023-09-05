import { ScammerInfo } from "src/types";

export function getChainBlockTime(chainId: number): number {
  switch (chainId) {
    case 10: // Optimism
      return 2;
    case 56: // BNB Smart Chain
      return 3;
    case 137: // Polygon
      return 2;
    case 250: // Fantom
      return 2;
    case 42161: // Arbitrum
      return 1;
    case 43114: // Avalance
      return 2;
    default: // Ethereum
      return 12;
  }
}

export function getBlocksInTimePeriodForChainId(timePeriodInSecs: number, chainId: number): number {
  const chainBlockTime = getChainBlockTime(chainId);

  return timePeriodInSecs / chainBlockTime;
}

export function cleanObject(object: { [key: string]: ScammerInfo }) {
  // Sort and delete 1/4 of the keys
  const sortedKeys = Object.keys(object).sort((a, b) => {
    const latestTimestampA = object[a].mostRecentActivityByBlockNumber;
    const latestTimestampB = object[b].mostRecentActivityByBlockNumber;
    return latestTimestampA - latestTimestampB;
  });

  // Ensure that at least one key will be deleted in the theoretical edge case where Math.floor(sortedKeys.length / 4) equals 0
  const indexToDelete = Math.max(1, Math.floor(sortedKeys.length / 4));

  for (let i = 0; i < indexToDelete; i++) {
    delete object[sortedKeys[i]];
  }
}
