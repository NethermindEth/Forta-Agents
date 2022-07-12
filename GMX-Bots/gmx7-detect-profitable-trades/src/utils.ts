import { ethers, getEthersProvider } from "forta-agent";

interface NetworkData {
    address: string;
  }
  const data: Record<number, NetworkData> = {
    42161: {
      address: "0xabbc5f99639c9b6bcb58544ddf04efa6802f4064",
    },
    43114: {
      address: "0x5f719c2f1095f7b9fc68a68e35b51194f4b6abe8",
    },
  };
  const SWAP_EVENT =
    "event Swap(address account, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)";

  //Represents the ratio at which an account becomes suspicious of having too many profitable trades
  const PROFIT_RATIO = 0.9; //0 to 1, 0.5

  //Represents the number of trades an account can make before the bot will monitor its ratio
  const GRACE_TRADES = 5; //1+

  const aggregatorV3InterfaceABI = [{ "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "description", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint80", "name": "_roundId", "type": "uint80" }], "name": "getRoundData", "outputs": [{ "internalType": "uint80", "name": "roundId", "type": "uint80" }, { "internalType": "int256", "name": "answer", "type": "int256" }, { "internalType": "uint256", "name": "startedAt", "type": "uint256" }, { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "latestRoundData", "outputs": [{ "internalType": "uint80", "name": "roundId", "type": "uint80" }, { "internalType": "int256", "name": "answer", "type": "int256" }, { "internalType": "uint256", "name": "startedAt", "type": "uint256" }, { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "version", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }];
  const provider = getEthersProvider();

  const priceFeedData = {
    wethPriceFeed: new ethers.Contract("0x639fe6ab55c921f74e7fac1ee960c0b6293ba612", aggregatorV3InterfaceABI, provider),
    wbtcPriceFeed: new ethers.Contract("0x6ce185860a4963106506c203335a2910413708e9", aggregatorV3InterfaceABI, provider),
    linkPriceFeed: new ethers.Contract("0x86e53cf1b870786351da77a57575e79cb55812cb", aggregatorV3InterfaceABI, provider),
    uniPriceFeed: new ethers.Contract("0x9c917083fdb403ab5adbec26ee294f6ecada2720", aggregatorV3InterfaceABI, provider),
    usdcPriceFeed: new ethers.Contract("0x50834f3163758fcc1df9973b6e91f0f0f0434ad3", aggregatorV3InterfaceABI, provider),
    usdtPriceFeed: new ethers.Contract("0x3f3f5df88dc9f13eac63df89ec16ef6e7e25dde7", aggregatorV3InterfaceABI, provider),
    daiPriceFeed: new ethers.Contract("0xc5c8e77b397e531b8ec06bfb0048328b30e9ecfb", aggregatorV3InterfaceABI, provider),
    fraxPriceFeed: new ethers.Contract("0x0809e3d38d1b4214958faf06d8b1b1a2b73f2ab8", aggregatorV3InterfaceABI, provider),
    mimPriceFeed: new ethers.Contract("0x87121f6c9a9f6e90e59591e4cf4804873f54a95b", aggregatorV3InterfaceABI, provider)
    };
  
  export default {
    data,
    SWAP_EVENT,
    PROFIT_RATIO,
    GRACE_TRADES,
    provider,
    priceFeedData
  };