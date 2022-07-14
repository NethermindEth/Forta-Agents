import { Finding, TransactionEvent, FindingSeverity, FindingType, ethers, getEthersProvider } from "forta-agent";
import util from "./utils";
import { NetworkManager } from "forta-agent-tools";

const networkManager = new NetworkManager(util.data);

//Maps addresses to their trade history [numberOfProfitableTrades, numberOfTrades, profitSoFar]
let tradeHistory = new Map<string, [number, number, number]>([]);

let priceFeedCache = new Map<[string, number], number>([]);

let priceFeeds = new Map<string, ethers.Contract>([]);
export const initialize = (provider: ethers.providers.Provider, priceFeedData: any) => async () => {
  await networkManager.init(provider);
  priceFeeds.set("0x82af49447d8a07e3bd95bd0d56f35241523fbab1", priceFeedData.wethPriceFeed); //WETH
  priceFeeds.set("0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f", priceFeedData.wbtcPriceFeed); //WBTC
  priceFeeds.set("0xf97f4df75117a78c1a5a0dbb814af92458539fb4", priceFeedData.linkPriceFeed); //LINK
  priceFeeds.set("0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0", priceFeedData.uniPriceFeed); //UNI
  priceFeeds.set("0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", priceFeedData.usdcPriceFeed); //USDC
  priceFeeds.set("0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", priceFeedData.usdtPriceFeed); //USDT
  priceFeeds.set("0xda10009cbd5d07dd0cecc66161fc93d7c9000da1", priceFeedData.daiPriceFeed); //DAI
  priceFeeds.set("0x17fc002b466eec40dae837fc4be5c67993ddbd6f", priceFeedData.fraxPriceFeed); //FRAX
  priceFeeds.set("0xfea7a6a0b346362bf88a9e4a88416b77a57d6c2a", priceFeedData.mimPriceFeed); //MIM
};

export const provideHandleTx =
  (networkManager: any, swapEvent: string, priceFeeds: any) => async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const swapEvents = txEvent.filterLog(swapEvent);

    //detect calls to the GMX router
    if (txEvent.to == networkManager.get("address")) {
      for (let i = 0; i < swapEvents.length; i++) {
        const { account, tokenIn, tokenOut, amountIn, amountOut } = swapEvents[i].args;

        let unitPriceIn = 0;
        let unitPriceOut = 0;
        if (priceFeedCache.has([tokenIn.toLowerCase(), txEvent.blockNumber])) {
          unitPriceIn = priceFeedCache.get([tokenIn.toLowerCase(), txEvent.blockNumber])!;
        } else {
          const {
            roundId: roundIdIn,
            answer: answerIn,
            startedAt: startedAtIn,
            updatedAt: updatedAtIn,
            answeredInRound: answeredInRoundIn,
          } = await priceFeeds.get(tokenIn.toLowerCase())!.latestRoundData();
          priceFeedCache.set([tokenIn.toLowerCase(), txEvent.blockNumber], answerIn);
          unitPriceIn = answerIn;
        }
        if (priceFeedCache.has([tokenOut.toLowerCase(), txEvent.blockNumber])) {
          unitPriceOut = priceFeedCache.get([tokenOut.toLowerCase(), txEvent.blockNumber])!;
        } else {
          const {
            roundId: roundIdOut,
            answer: answerOut,
            startedAt: startedAtOut,
            updatedAt: updatedAtOut,
            answeredInRound: answeredInRoundOut,
          } = await priceFeeds.get(tokenOut.toLowerCase())!.latestRoundData();
          priceFeedCache.set([tokenIn.toLowerCase(), txEvent.blockNumber], answerOut);
          unitPriceOut = answerOut;
        }

        const priceIn = unitPriceIn * (amountIn / 10 ** 8);
        const priceOut = unitPriceOut * (amountOut / 10 ** 8);

        //check if the address has previous trades
        if (tradeHistory.has(account)) {
          let profitableTrades = tradeHistory.get(account)![0];
          let totalTrades = tradeHistory.get(account)![1];
          let totalProfit = tradeHistory.get(account)![2];

          if (priceOut > priceIn) {
            profitableTrades++;
          }
          totalTrades++;
          totalProfit += priceOut - priceIn;
          tradeHistory.set(account, [profitableTrades, totalTrades, totalProfit]);

          //if an account using gmx has an unusual amount of profitable trades, report it
          if (profitableTrades / totalTrades >= util.PROFIT_RATIO && totalTrades > util.GRACE_TRADES) {
            findings.push(
              Finding.fromObject({
                name: "Unusual amount of profitable trades",
                description: `User ${account.toLowerCase()} has a ${
                  (profitableTrades / totalTrades) * 100
                }% profitable trade ratio`,
                alertId: "GMX-07",
                protocol: "GMX",
                severity: FindingSeverity.Medium,
                type: FindingType.Suspicious,
                metadata: {
                  account: account.toLowerCase(),
                  profitableTrades: profitableTrades.toString(),
                  totalTrades: totalTrades.toString(),
                  totalProfit: totalProfit.toString(), //in USD
                },
              })
            );
          }
        }
        //store address's first trade information
        else {
          let profitableTrades = 0;
          if (priceOut > priceIn) {
            profitableTrades++;
          }
          tradeHistory.set(account, [profitableTrades, 1, priceOut - priceIn]);
        }
      }
    }
    return findings;
  };

export default {
  initialize: initialize(util.provider, util.priceFeedData),
  handleTransaction: provideHandleTx(networkManager, util.SWAP_EVENT, priceFeeds),
};
