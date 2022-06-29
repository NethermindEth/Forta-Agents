import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  Log,
  LogDescription,
  ethers,
  getEthersProvider,
} from "forta-agent";

//Strategy: Store the total swaps and profitable swaps each time a swap is done (use map for each address). Then if the ratio is above 90% then a finding is created.
//Remember to only have it go into effect after X trades

//DONE Make bot scan arbitrum instead of eth
//DONE Detect transaction calls to gmx arbitrum with swap event
//DONE Make map that stores addresses, profit ratio, profits, etc
//DONE Make bot store addresses after swaps if they are profitable (hardcode profit)
//DONE Use grace period
//DONE Add Chainlik Price Feeds (make sure to check eth one)
//DONE Multiply times number of tokens, taking into account decimals
//DONE Replace hardcoded profit with calls to chainlink oracle (Remember to check for errors or non existant tokens, also cache datafeed addresses)
//DONE Make caching system

//TODO: Write tests
//TODO: Make it work for avalanche
//TODO: Clean up & apply PR changes

export const GMX_ROUTER_ADDRESS = "0xabbc5f99639c9b6bcb58544ddf04efa6802f4064";
export const SWAP_EVENT =
  "event Swap(address account, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)";

//Represents the ratio at which an account becomes suspicious of having too many profitable trades
const PROFIT_RATIO = 0.9; //0 to 1, 0.5

//Represents the number of trades an account can make before the bot will monitor its ratio
const GRACE_TRADES = 5; //1+

const provider = getEthersProvider();
const aggregatorV3InterfaceABI = [{ "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "description", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint80", "name": "_roundId", "type": "uint80" }], "name": "getRoundData", "outputs": [{ "internalType": "uint80", "name": "roundId", "type": "uint80" }, { "internalType": "int256", "name": "answer", "type": "int256" }, { "internalType": "uint256", "name": "startedAt", "type": "uint256" }, { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "latestRoundData", "outputs": [{ "internalType": "uint80", "name": "roundId", "type": "uint80" }, { "internalType": "int256", "name": "answer", "type": "int256" }, { "internalType": "uint256", "name": "startedAt", "type": "uint256" }, { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "version", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }];


//Maps addresses to their trade history [numberOfProfitableTrades, numberOfTrades, profitSoFar]
let tradeHistory = new Map<string, [number, number, number]>([]);

let priceFeedCache = new Map<[string, number], number>([]);

const wethPriceFeed = new ethers.Contract("0x639fe6ab55c921f74e7fac1ee960c0b6293ba612", aggregatorV3InterfaceABI, provider);
const wbtcPriceFeed = new ethers.Contract("0x6ce185860a4963106506c203335a2910413708e9", aggregatorV3InterfaceABI, provider);
const linkPriceFeed = new ethers.Contract("0x86e53cf1b870786351da77a57575e79cb55812cb", aggregatorV3InterfaceABI, provider);
const uniPriceFeed = new ethers.Contract("0x9c917083fdb403ab5adbec26ee294f6ecada2720", aggregatorV3InterfaceABI, provider);
const usdcPriceFeed = new ethers.Contract("0x50834f3163758fcc1df9973b6e91f0f0f0434ad3", aggregatorV3InterfaceABI, provider);
const usdtPriceFeed = new ethers.Contract("0x3f3f5df88dc9f13eac63df89ec16ef6e7e25dde7", aggregatorV3InterfaceABI, provider);
const daiPriceFeed = new ethers.Contract("0xc5c8e77b397e531b8ec06bfb0048328b30e9ecfb", aggregatorV3InterfaceABI, provider);
const fraxPriceFeed = new ethers.Contract("0x0809e3d38d1b4214958faf06d8b1b1a2b73f2ab8", aggregatorV3InterfaceABI, provider);
const mimPriceFeed = new ethers.Contract("0x87121f6c9a9f6e90e59591e4cf4804873f54a95b", aggregatorV3InterfaceABI, provider);
let priceFeeds = new Map<string, [ethers.Contract, number]>([]);
priceFeeds.set("0x82af49447d8a07e3bd95bd0d56f35241523fbab1",[wethPriceFeed, 18]); //WETH
priceFeeds.set("0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",[wbtcPriceFeed, 8]); //WBTC
priceFeeds.set("0xf97f4df75117a78c1a5a0dbb814af92458539fb4",[linkPriceFeed, 18]); //LINK
priceFeeds.set("0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0",[uniPriceFeed, 18]); //UNI
priceFeeds.set("0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",[usdcPriceFeed, 6]); //USDC
priceFeeds.set("0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",[usdtPriceFeed, 6]); //USDT
priceFeeds.set("0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",[daiPriceFeed, 18]); //DAI
priceFeeds.set("0x17fc002b466eec40dae837fc4be5c67993ddbd6f",[fraxPriceFeed, 18]); //FRAX
priceFeeds.set("0xfea7a6a0b346362bf88a9e4a88416b77a57d6c2a",[mimPriceFeed, 18]); //MIM

let unusualTrades = 0; //REMOVE

export const provideHandleTx =
  (router: string, swapEvent: string, theProvider: ethers.providers.Provider) => async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const swapEvents = txEvent.filterLog(swapEvent);
    console.log(unusualTrades); //REMOVE
    //detect calls to the GMX router
    if (txEvent.to == router) {
      for(let i = 0; i < swapEvents.length; i++) {
        const {
          account,
          tokenIn,
          tokenOut,
          amountIn,
          amountOut,
        } = swapEvents[i].args;

        let tooManyProfitableTrades = false;

        let unitPriceIn = 0;
        let unitPriceOut = 0;
        if(priceFeedCache.has([tokenIn.toLowerCase(), txEvent.blockNumber])){
          unitPriceIn = priceFeedCache.get([tokenIn.toLowerCase(), txEvent.blockNumber])!;
        }
        else{
          const {roundId: roundIdIn, answer: answerIn, startedAt: startedAtIn, updatedAt: updatedAtIn, answeredInRound: answeredInRoundIn} = await priceFeeds.get(tokenIn.toLowerCase())![0].latestRoundData();
          priceFeedCache.set([tokenIn.toLowerCase(), txEvent.blockNumber], answerIn);
          unitPriceIn = answerIn;
        }
        if(priceFeedCache.has([tokenOut.toLowerCase(), txEvent.blockNumber])){
          unitPriceOut = priceFeedCache.get([tokenOut.toLowerCase(), txEvent.blockNumber])!;
        }
        else{
          const {roundId: roundIdOut, answer: answerOut, startedAt: startedAtOut, updatedAt: updatedAtOut, answeredInRound: answeredInRoundOut} = await priceFeeds.get(tokenOut.toLowerCase())![0].latestRoundData();
          priceFeedCache.set([tokenIn.toLowerCase(), txEvent.blockNumber], answerOut);
          unitPriceOut = answerOut;
        }

        
        const decimalsIn = priceFeeds.get(tokenIn.toLowerCase())![1];
        const decimalsOut = priceFeeds.get(tokenOut.toLowerCase())![1];
        const priceIn = unitPriceIn * (amountIn / 10**decimalsIn);
        const priceOut = unitPriceOut * (amountOut / 10**decimalsOut);

        //check if the address has previous trades
        if (tradeHistory.has(account)) {
          let profitableTrades = tradeHistory.get(account)![0];
          let totalTrades = tradeHistory.get(account)![1];
          let totalProfit = tradeHistory.get(account)![2];

          if(priceOut > priceIn){
            profitableTrades++;
          }
          totalTrades++;
          totalProfit += (priceOut - priceIn) / 10**8;

          tradeHistory.set(account, [profitableTrades, totalTrades, totalProfit]);
          
          if(profitableTrades / totalTrades >= PROFIT_RATIO && totalTrades > GRACE_TRADES){
            tooManyProfitableTrades = true;
          }

        }
        //store address's first trade information
        else {
          let profitableTrades = 0;
          if(priceOut > priceIn){
            profitableTrades++;
          }
          tradeHistory.set(account, [profitableTrades, 1, (priceOut - priceIn) / 10**8]);
        }

        //if an account using gmx has an unusual amount of profitable trades, report it
        if (tooManyProfitableTrades) {
          findings.push(
            Finding.fromObject({
              name: "Sandwich Attack Frontrun",
              description: `User ${account.toLowerCase()} has a ${PROFIT_RATIO * 100}% profitable trade ratio`,
              alertId: "GMX-05",
              severity: FindingSeverity.Medium,
              type: FindingType.Suspicious,
              metadata: {
                acount: account,
              },
            })
          );
          unusualTrades++; //REMOVE
        }
      }
    }
    return findings;
  };

// const handleBlock: HandleBlock = async (blockEvent: BlockEvent) => {
//   const findings: Finding[] = [];
//   // detect some block condition
//   return findings;
// }

export default {
  handleTransaction: provideHandleTx(GMX_ROUTER_ADDRESS, SWAP_EVENT, provider),
  // handleBlock
};
