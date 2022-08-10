import { ethers, Finding, FindingType, FindingSeverity } from "forta-agent";
import { BigNumber } from "ethers";
import { getCreate2Address } from "@ethersproject/address";

const getPancakePairCreate2Address = (
  pancakeFactoryAddr: string,
  token0: string,
  token1: string,
  initCode: string
): string => {
  const salt = ethers.utils.solidityKeccak256(["address", "address"], [token0, token1]);
  return getCreate2Address(pancakeFactoryAddr, salt, initCode);
};

const createFinding = (
  pairAddress: string,
  swapTokenIn: string,
  swapTokenOut: string,
  swapAmountIn: BigNumber,
  swapAmountOut: BigNumber,
  percentageTokenIn: BigNumber,
  percentageTokenOut: BigNumber,
  swap_recipient: string
): Finding => {
  return Finding.from({
    name: "Large swap",
    description: "A swap that involved a significant percentage of a pool's liquidity was detected",
    alertId: "CAKE-2",
    protocol: "PancakeSwap",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      pancakePair: pairAddress,
      tokenIn: swapTokenIn,
      tokenOut: swapTokenOut,
      amountIn: swapAmountIn.toString(),
      amountOut: swapAmountOut.toString(),
      percentageIn: percentageTokenIn.toString(),
      percentageOut: percentageTokenOut.toString(),
      swapRecipient: swap_recipient,
    },
  });
};

export { createFinding, getPancakePairCreate2Address };
