function getChainBlockTime(chainId: number): number {
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
