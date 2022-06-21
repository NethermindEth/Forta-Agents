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

//TODO: Replace hardcoded profit with calls to chainlink oracle (Remember to check for errors or non existant tokens, also cache datafeed addresses)
//TODO: Write tests
//TODO: Clean up

export const GMX_ROUTER_ADDRESS = "0xabbc5f99639c9b6bcb58544ddf04efa6802f4064";
export const SWAP_EVENT =
  "event Swap(address account, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)";

//Represents the ratio at which an account becomes suspicious of having too many profitable trades
const PROFIT_RATIO = 0.9; //0 to 1, 0.5

//Represents the number of trades an account can make before the bot will monitor its ratio
const GRACE_TRADES = 5; //1+

//Maps addresses to their trade history [numberOfProfitableTrades, numberOfTrades, profitSoFar]
let tradeHistory = new Map<string, [number, number, number]>([]);

let unusualTrades = 0; //REMOVE

export const provideHandleTx =
  (router: string, swapEvent: string, theProvider: ethers.providers.Provider) => async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const swapEvents = txEvent.filterLog(swapEvent);
    console.log(unusualTrades); //REMOVE
    //detect calls to the GMX router
    if (txEvent.to == router) {
      swapEvents.forEach((swapEvent) => {
        const {
          account,
          tokenIn,
          tokenOut,
          amountIn,
          amountOut,
        } = swapEvent.args;

        let tooManyProfitableTrades = false;
        let profitOrLoss = 1;
        let profitAmount = 500;

        //check if the address has previous trades
        if (tradeHistory.has(account)) {
          let profitableTrades = tradeHistory.get(account)![0];
          let totalTrades = tradeHistory.get(account)![1];
          let totalProfit = tradeHistory.get(account)![2];
          profitableTrades += profitOrLoss;
          totalTrades++;
          totalProfit += profitAmount;

          tradeHistory.set(account, [profitableTrades, totalTrades, totalProfit]);
          
          if(profitableTrades / totalTrades >= PROFIT_RATIO && totalTrades > GRACE_TRADES){
            tooManyProfitableTrades = true;
          }

        }
        //store address's first trade information
        else {
          tradeHistory.set(account, [profitOrLoss, 1, profitAmount]);
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
                aacount: account,
              },
            })
          );
          unusualTrades++; //REMOVE
        }
      });
    }
    return findings;
  };

// const handleBlock: HandleBlock = async (blockEvent: BlockEvent) => {
//   const findings: Finding[] = [];
//   // detect some block condition
//   return findings;
// }

export default {
  handleTransaction: provideHandleTx(GMX_ROUTER_ADDRESS, SWAP_EVENT, getEthersProvider()),
  // handleBlock
};
