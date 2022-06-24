import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";

import { getCreate2Address } from "@ethersproject/address";
import { BigNumber, utils } from "ethers";
import { PAIR_INIT_CODE_HASH } from "./constants";

export const createPair = (token0: string, token1: string, factory: string): string => {
  let salt: string = utils.solidityKeccak256(["address", "address"], [token0, token1]);
  return getCreate2Address(factory, salt, PAIR_INIT_CODE_HASH).toLowerCase();
};

export const createFinding = (log: LogDescription, token0: string, token1: string, totalSupply: BigNumber): Finding => {
  const metadata = {
    poolAddress: log.address,
    token0: token0,
    amount0: parseInt(utils.formatEther(log.args.amount0)).toFixed(2),
    token1: token1,
    amount1: parseInt(utils.formatEther(log.args.amount1)).toFixed(2),
    totalSupply: parseInt(utils.formatEther(totalSupply)).toFixed(2),
  };

  if (log.name === "Mint") {
    return Finding.fromObject({
      name: "Large LP Deposit in Pancakeswap pool",
      description: `${log.name} event with large amounts emitted from Pancakeswap pool`,
      alertId: "CAKE-3-1",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "Pancakeswap",
      metadata,
    });
  } else
    return Finding.fromObject({
      name: "Large LP Withdrawal from Pancakeswap pool",
      description: `${log.name} event with large amount emitted from an Pancakeswap pool`,
      alertId: "CAKE-3-2",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "Apeswap",
      metadata,
    });
};
