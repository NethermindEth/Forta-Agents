import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (tokenA: string, tokenB: string, pair: string): Finding => {
  return Finding.fromObject({
    name: "New pair creation on Pancakeswap's Factory contract",
    description: "New pair creation call detected on Factory contract",
    alertId: "CAKE-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Pancakeswap",
    metadata: {
      tokenA,
      tokenB,
      pair,
    },
  });
};
