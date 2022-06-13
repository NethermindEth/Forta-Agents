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

export const GMX_ROUTER_ADDRESS = "0xabbc5f99639c9b6bcb58544ddf04efa6802f4064";
export const SWAP_EVENT =
  "event Swap(address account, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)";

//Represents the calls that will be stored to check for frontrunning. A bigger value makes sure no cases are ignored but makes the bot less efficient
const CALL_HISTORY_SIZE = 20;

let callHistoryKeys: Array<string> = new Array(CALL_HISTORY_SIZE);
let callHistoryIndex = 0;
let mapCleanerCounter = 0;
let callHistoryFull = false;
let callHistory = new Map<string, [LogDescription, number, string]>([]);

export const provideHandleTx =
  (router: string, swapEvent: string, theProvider: ethers.providers.Provider) => async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const swapEvents = txEvent.filterLog(swapEvent);
    //detect calls to the GMX router
    if (txEvent.to == router) {
      swapEvents.forEach((swapEvent) => {
        const {
          account: accountBack,
          tokenIn: tokenInBack,
          tokenOut: tokenOutBack,
          amountIn: amountInBack,
          amountOut: amountOutBack,
        } = swapEvent.args;

        //order tokens in lexicographical order for the map key
        let token0 = "";
        let token1 = "";
        if (tokenInBack > tokenOutBack) {
          token0 = tokenOutBack;
          token1 = tokenInBack;
        } else {
          token0 = tokenInBack;
          token1 = tokenOutBack;
        }

        let sandwichAttack: boolean = false;
        let victimAddress = "";
        let frontHash = "";
        let victimHash = "";
        let victimTokenIn = "";
        let victimTokenOut = "";
        let victimTokenInAmount = 0;
        let victimTokenOutAmount = 0;
        let frontrunnerAddress = "";
        let frontrunnerProfit = 0;
        let victimAddressAndTokens: string = "";
        let frontrunnerAddressAndTokens: string = "";

        //check if there is a transaction that completes the sandwich
        if (callHistory.has(accountBack + token0 + token1)) {
          let potentialSandwhichFront: [LogDescription, number, string] = callHistory.get(
            accountBack + token0 + token1
          )!;
          const {
            account: accountFront,
            tokenIn: tokenInFront,
            tokenOut: tokenOutFront,
            amountIn: amountInFront,
            amountOut: amountOutFront,
          } = potentialSandwhichFront[0].args;

          //check if the front transaction trades the same tokens in the opposite direction as the back transaction
          if (tokenInBack == tokenOutFront && tokenOutBack == tokenInFront) {
            //find any victim transaction
            callHistoryKeys.forEach((addressAndTokens) => {
              let event = callHistory.get(addressAndTokens)!;
              const {
                account: accountVictim,
                tokenIn: tokenInVictim,
                tokenOut: tokenOutVictim,
                amountIn: amountInVictim,
                amountOut: amountOutVictim,
              } = event[0].args;
              //check if victim was inside the sandwich
              if (
                (event[1] > potentialSandwhichFront[1] &&
                  event[1] < callHistoryIndex &&
                  callHistoryIndex > potentialSandwhichFront[1]) ||
                (event[1] < potentialSandwhichFront[1] &&
                  event[1] < callHistoryIndex &&
                  callHistoryIndex < potentialSandwhichFront[1]) ||
                (event[1] > potentialSandwhichFront[1] &&
                  event[1] > callHistoryIndex &&
                  callHistoryIndex < potentialSandwhichFront[1])
              ) {
                //check if the victim transaction trades the same tokens in the same direction as the front transaction
                if (tokenInVictim == tokenInFront && tokenOutVictim == tokenOutFront) {
                  sandwichAttack = true;
                  victimAddress = accountVictim;
                  frontHash = potentialSandwhichFront[2];
                  victimHash = event[2];
                  victimTokenIn = tokenInVictim;
                  victimTokenOut = tokenOutVictim;
                  victimTokenInAmount = amountInVictim;
                  victimTokenOutAmount = amountOutVictim;
                  frontrunnerAddress = accountFront;
                  frontrunnerProfit = amountOutBack - amountInFront;
                  victimAddressAndTokens = addressAndTokens;
                  frontrunnerAddressAndTokens = accountBack + token0 + token1;
                }
              }
            });
            //transaction gets stored
            if (!sandwichAttack) {
              callHistory.set(accountBack + token0 + token1, [swapEvent, callHistoryIndex, txEvent.hash]);
              callHistoryKeys[callHistoryIndex] = accountBack + token0 + token1;
            }
          }
          //transaction gets stored
          else {
            callHistory.set(accountBack + token0 + token1, [swapEvent, callHistoryIndex, txEvent.hash]);
            callHistoryKeys[callHistoryIndex] = accountBack + token0 + token1;
          }
        }
        //transaction gets stored
        else {
          callHistory.set(accountBack + token0 + token1, [swapEvent, callHistoryIndex, txEvent.hash]);
          callHistoryKeys[callHistoryIndex] = accountBack + token0 + token1;
        }

        callHistoryIndex++;
        mapCleanerCounter++;

        //callHistory cleaning
        if (callHistoryIndex == CALL_HISTORY_SIZE) {
          callHistoryFull = true;
          callHistoryIndex = 0;

          if (mapCleanerCounter > 50000) {
            mapCleanerCounter = 0;
            Array.from(callHistory.keys()).forEach((addressAndTokens) => {
              let beingUsed = false;
              callHistoryKeys.forEach((key) => {
                if (addressAndTokens == key) {
                  beingUsed = true;
                }
              });
              if (!beingUsed) {
                callHistory.delete(addressAndTokens);
              }
            });
          }
        }

        //if a gmx trade was frontrun with a sandwich attack, report it
        if (sandwichAttack) {
          callHistory.delete(victimAddressAndTokens);
          callHistory.delete(frontrunnerAddressAndTokens);
          findings.push(
            Finding.fromObject({
              name: "Sandwich Attack Frontrun",
              description: `User ${victimAddress.toLowerCase()} suffered a sandwich attack`,
              alertId: "GMX-05",
              protocol: "GMX",
              severity: FindingSeverity.Medium,
              type: FindingType.Suspicious,
              metadata: {
                sandwichFrontTransaction: frontHash,
                victimTransaction: victimHash,
                sandwichBackTransaction: txEvent.hash,
                victimAddress: victimAddress.toLowerCase(),
                victimTokenIn: victimTokenIn.toLowerCase(),
                victimTokenOut: victimTokenOut.toLowerCase(),
                victimTokenInAmount: victimTokenInAmount.toString(),
                victimTokenOutAmount: victimTokenOutAmount.toString(),
                frontrunnerAddress: frontrunnerAddress.toLowerCase(),
                frontrunnerProfit: frontrunnerProfit.toString(), //in terms of tokenIn
              },
            })
          );
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
