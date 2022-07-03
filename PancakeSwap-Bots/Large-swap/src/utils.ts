import { ethers, Finding, FindingType, FindingSeverity } from "forta-agent";
import { createAddress } from "forta-agent-tools/lib/tests.utils";
import BigNumber from "bignumber.js";
BigNumber.set({ DECIMAL_PLACES: 18 });

const SWAP_EVENT =
  "event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out,uint amount1Out,address indexed to)";

const LARGE_THRESHOLD = "0"; // percent
const ERC20ABI = "function balanceOf(address account) public view returns (uint256)";
const PANCAKE_PAIR_ABI = [
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
];
const PANCAKE_FACTORY_ABI = "function getPair(address tokenA, address tokenB) external view returns (address pair)";
const PANCAKE_FACTORY_ADDRESS = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";

const toBn = (ethersBn: ethers.BigNumber) => new BigNumber(ethersBn.toString());

const createContract = (contractAddress: string, abi: string|string[], provider: ethers.providers.Provider) =>
  new ethers.Contract(contractAddress, abi, provider);

const isValidPancakePair = async (
  pairAddress: string,
  provider: ethers.providers.Provider
): Promise<[boolean, string, string]> => {
  const pairContract = createContract(pairAddress, PANCAKE_PAIR_ABI, provider);
  const token0Address: string = await pairContract.token0();
  const token1Address: string = await pairContract.token1();
  const pancakeFactory = createContract(PANCAKE_FACTORY_ADDRESS, PANCAKE_FACTORY_ABI, provider);
  const tokenPair: string = await pancakeFactory.getPair(token0Address, token1Address);
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
  return toBn(await tokenContract.balanceOf(pairAddress, { blockTag: blockNumber }));
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
      "Swap Recipient": swap_recipient
    },
  });
};


export 
{
    createFinding, 
    getERC20Balance, 
    isValidPancakePair, 
    SWAP_EVENT, 
    LARGE_THRESHOLD, 
    ERC20ABI, 
    PANCAKE_PAIR_ABI, 
    toBn,
    PANCAKE_FACTORY_ABI
}
