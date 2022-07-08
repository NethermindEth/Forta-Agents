import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";
import { BigNumber } from "ethers";

export const createFinding = (log: LogDescription, token0: string, token1: string, totalSupply: BigNumber): Finding => {
  const metadata = {
    poolAddress: log.address,
    token0: token0,
    token1: token1,
    amount0: log.args.amount0.toString(),
    amount1: log.args.amount1.toString(),
    totalSupply: totalSupply.toString(),
  };

  if (log.name === "Mint") {
    return Finding.fromObject({
      name: "Large LP Deposit in Pancakeswap pool",
      description: `${log.name} event with large amounts emitted from a Pancakeswap pool`,
      alertId: "CAKE-3-1",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "Pancakeswap",
      metadata,
    });
  } else
    return Finding.fromObject({
      name: "Large LP Withdrawal from Pancakeswap pool",
      description: `${log.name} event with large amount emitted from a Pancakeswap pool`,
      alertId: "CAKE-3-2",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "Pancakeswap",
      metadata,
    });
};
