import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  ethers,
  getEthersProvider,
  HandleTransaction,
} from "forta-agent";
import { SWAP_EVENT, aggregatorV3InterfaceABI } from "./utils";
import { NetworkManager } from "forta-agent-tools";
import { CONFIG, GRACE_TRADES, PROFIT_RATIO } from "./agent.config";

const networkManager = new NetworkManager(CONFIG);

//Maps addresses to their trade history [numberOfProfitableTrades, numberOfTrades, profitSoFar]
const tradeHistory = new Map<string, [number, number, number]>([]);

const priceFeedCache = new Map<[string, number], number>([]);

const priceFeeds = new Map<string, ethers.Contract>([]);

const priceFeedData = {};

export const initialize = (provider: ethers.providers.Provider, priceFeedData: any) => async () => {
  await networkManager.init(provider);
  const tokens = networkManager.get("tokens");
  const priceFeed = networkManager.get("priceFeed");

  priceFeedData = {
    wethPriceFeed: new ethers.Contract(priceFeed.WETH, aggregatorV3InterfaceABI, provider),
    wbtcPriceFeed: new ethers.Contract(priceFeed.WBTC, aggregatorV3InterfaceABI, provider),
    linkPriceFeed: new ethers.Contract(priceFeed.LINK, aggregatorV3InterfaceABI, provider),
    uniPriceFeed: new ethers.Contract(priceFeed.UNI, aggregatorV3InterfaceABI, provider),
    usdcPriceFeed: new ethers.Contract(priceFeed.USDC, aggregatorV3InterfaceABI, provider),
    usdtPriceFeed: new ethers.Contract(priceFeed.USDT, aggregatorV3InterfaceABI, provider),
    daiPriceFeed: new ethers.Contract(priceFeed.DAI, aggregatorV3InterfaceABI, provider),
    fraxPriceFeed: new ethers.Contract(priceFeed.FRAX, aggregatorV3InterfaceABI, provider),
    mimPriceFeed: new ethers.Contract(priceFeed.MIM, aggregatorV3InterfaceABI, provider),
  };

  priceFeeds.set(tokens.WETH, priceFeedData.wethPriceFeed);
  priceFeeds.set(tokens.WBTC, priceFeedData.wbtcPriceFeed);
  priceFeeds.set(tokens.LINK, priceFeedData.linkPriceFeed);
  priceFeeds.set(tokens.UNI, priceFeedData.uniPriceFeed);
  priceFeeds.set(tokens.USDC, priceFeedData.usdcPriceFeed);
  priceFeeds.set(tokens.USDT, priceFeedData.usdtPriceFeed);
  priceFeeds.set(tokens.DAI, priceFeedData.daiPriceFeed);
  priceFeeds.set(tokens.FRAX, priceFeedData.fraxPriceFeed);
  priceFeeds.set(tokens.MIM, priceFeedData.mimPriceFeed);
};

export const provideHandleTx = (networkManager: any, swapEvent: string, priceFeeds: any): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
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
          const { answer: answerIn } = await priceFeeds.get(tokenIn.toLowerCase())!.latestRoundData();
          priceFeedCache.set([tokenIn.toLowerCase(), txEvent.blockNumber], answerIn);
          unitPriceIn = answerIn;
        }
        if (priceFeedCache.has([tokenOut.toLowerCase(), txEvent.blockNumber])) {
          unitPriceOut = priceFeedCache.get([tokenOut.toLowerCase(), txEvent.blockNumber])!;
        } else {
          const { answer: answerOut } = await priceFeeds.get(tokenOut.toLowerCase())!.latestRoundData();
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
          if (profitableTrades / totalTrades >= PROFIT_RATIO && totalTrades > GRACE_TRADES) {
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
};

export default {
  initialize: initialize(getEthersProvider(), priceFeedData),
  handleTransaction: provideHandleTx(networkManager, SWAP_EVENT, priceFeeds),
};
