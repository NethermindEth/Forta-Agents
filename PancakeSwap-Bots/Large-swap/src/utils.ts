import { ethers, Finding, FindingType, FindingSeverity } from "forta-agent";
import { createAddress } from "forta-agent-tools/lib/tests.utils";
import BigNumber from "bignumber.js";
import { getCreate2Address } from "@ethersproject/address";
import { ERC20ABI, PANCAKE_PAIR_ABI } from "./constants";

BigNumber.set({ DECIMAL_PLACES: 18 });

const toBn = (ethersBn: ethers.BigNumberish) => new BigNumber(ethersBn.toString());

const createContract = (contractAddress: string, abi: string | string[], provider: ethers.providers.Provider) =>
  new ethers.Contract(contractAddress, abi, provider);

const isValidPancakePair = async (
  pairAddress: string,
  provider: ethers.providers.Provider,
  block: number,
  pancakeFactoryAddr: string,
  init: string
): Promise<[boolean, string, string]> => {
  const pairContract = createContract(pairAddress, PANCAKE_PAIR_ABI, provider);
  let token0Address: string, token1Address: string;
  try {
    [token0Address, token1Address] = await Promise.all([
      pairContract.token0({ blockTag: block }),
      pairContract.token1({ blockTag: block }),
    ]);
  } catch (error) {
    return [false, "", ""];
  }
  const tokenPair = getPancakePairCreate2Address(pancakeFactoryAddr, token0Address, token1Address, init);
  const isValid =
    tokenPair !== createAddress("0x0") && tokenPair.toLowerCase() === pairAddress.toLowerCase() ? true : false;
  return [isValid, token0Address, token1Address];
};

const getERC20Balance = async (
  tokenAddress: string,
  pairAddress: string,
  provider: ethers.providers.Provider,
  blockNumber: number
): Promise<BigNumber> => {
  const tokenContract = createContract(tokenAddress, ERC20ABI, provider);
  try {
    return toBn(await tokenContract.balanceOf(pairAddress, { blockTag: blockNumber }));
  } catch (error) {
    return toBn("0");
  }
};

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
    alertId: "CAKE02",
    protocol: "PANCAKESWAP",
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    metadata: {
      "Pancake Pair": pairAddress,
      "Token In": swapTokenIn,
      "Token Out": swapTokenOut,
      amountIn: swapAmountIn.toString(),
      amountOut: swapAmountOut.toString(),
      percentageIn: percentageTokenIn.toFixed(2),
      percentageOut: percentageTokenOut.toFixed(2),
      "Swap Recipient": swap_recipient,
    },
  });
};

export { createFinding, getERC20Balance, isValidPancakePair, toBn, getPancakePairCreate2Address };
