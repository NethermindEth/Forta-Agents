import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  LogDescription,
  ethers,
  getEthersProvider,
} from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import util from "./utils";

const provider = getEthersProvider();
const networkManager = new NetworkManager(util.data);

export const initialize = (provider: ethers.providers.Provider) => async () => {
  await networkManager.init(provider);
};

let callHistoryKeys: Array<string> = new Array(util.CALL_HISTORY_SIZE);
let callHistoryIndex = 0;
let mapCleanerCounter = 0;
let callHistory = new Map<string, [LogDescription, number, string]>([]);

export const provideHandleTx = (networkManager: any, swapEvent: string) => async (txEvent: TransactionEvent) => {
  const findings: Finding[] = [];
  const swapEvents = txEvent.filterLog(swapEvent);

  //detect calls to the GMX router
  if (txEvent.to === networkManager.get("address")) {
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
        let potentialSandwhichFront: [LogDescription, number, string] = callHistory.get(accountBack + token0 + token1)!;
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
              // ******************************************
              // R-NOTE: THIS MAY BE WHERE THE ISSUE LIES.
              // THEY DON'T HAVE TO BE SEQUENTIAL, THEY
              // JUST HAVE TO FIT THIS CRITERIA. IN THEORY,
              // THE callHistoryIndex OF EACH TXN SHOULD BE
              // MUCH TIGHTER, IF NOT EACH RIGHT AFTER THE
              // NEXT. (BY TIGHTER, MEAN WE SHOULD BE MINDFUL
              // OF HOW MANY TRANSACTIONS WE ARE ALLOWING
              // TO BE IN BETWEEN THE FRONT, VICTIM, AND
              // BACK TRANSACTION. WOULD NEED TO WRITE TESTS 
              // FOR THIS, PLUS SOME Poc TRANSACTIONS.
              // *******************************************
              (event[1] > potentialSandwhichFront[1] &&
                event[1] < callHistoryIndex &&
                callHistoryIndex > potentialSandwhichFront[1]) ||
              // R-NOTE: THIS NEXT CHECK WOULD PUT THE `victim` IN FRONT
              // OF BOTH SANDWICH TRANSACTIONS
              (event[1] < potentialSandwhichFront[1] &&
                event[1] < callHistoryIndex &&
                callHistoryIndex < potentialSandwhichFront[1]) ||
              // R-NOTE: THIS NEXT CHECK WOULD PUT THE `victim`
              // BEHIND BOTH SANDWICH TRANSACTIONS
              (event[1] > potentialSandwhichFront[1] &&
                event[1] > callHistoryIndex &&
                callHistoryIndex < potentialSandwhichFront[1])
            ) {
              //check if the victim transaction trades the same tokens in the same direction as the front transaction
              // R-NOTE: SHOULD ALSO CHECK IF `amountOutBack` IS GREATER THAN `amountInFront`
              // OTHERWISE IT IS NOT PROFITABLE.
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
        }
      }

      if (!sandwichAttack) {
        callHistory.set(accountBack + token0 + token1, [swapEvent, callHistoryIndex, txEvent.hash]);
        callHistoryKeys[callHistoryIndex] = accountBack + token0 + token1;
        callHistoryIndex++;
        mapCleanerCounter++;
      }

      //callHistory cleaning
      if (callHistoryIndex == util.CALL_HISTORY_SIZE) {
        // R-NOTE: IF WE SET TO ZERO IN THE MIDDLE OF AN
        // ATTACK, IT WON'T BE DETECTED BECAUSE IT'LL
        // BE RESET TO ZERO. COULD IT BE SET HIGHER THAN
        // THE HIGHEST callHistoryIndex THAT IS STILL
        // INSIDE OF callHistory. THEREFORE, WE COULD
        // LOOP THROUGH THE callHistory AND SET THIS
        // INDEX TO ONE ABOVE THE HIGHEST ONE. THAT WAY
        // WE CAN STILL CATCH AN ATTACK THAT IS CURRENTLY
        // TAKING PLACE. SHOULD BE FINE SINCE WE ARE
        // .deleteING THE VALUES IN callHistory WHEN
        // THERE IS A SANDWICH ATTACK. L177-178
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

export default {
  initialize: initialize(provider),
  handleTransaction: provideHandleTx(networkManager, util.SWAP_EVENT),
};
