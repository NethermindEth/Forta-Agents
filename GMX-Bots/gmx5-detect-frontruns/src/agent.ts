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
let GMX_ROUTER_ADDRESS = "";
const provider = getEthersProvider();
const networkManager = new NetworkManager(util.data);
export const initialize = (provider: ethers.providers.Provider) => async () => {
  //const networkManager = new NetworkManager(util.data, (await provider.getNetwork()).chainId);
  await networkManager.init(provider);
  //GMX_ROUTER_ADDRESS.value = networkManager.get("address");
};

let callHistoryKeys: Array<string> = new Array(util.CALL_HISTORY_SIZE);
let callHistoryIndex = 0;
let mapCleanerCounter = 0;
let callHistory = new Map<string, [LogDescription, number, string]>([]);

export const provideHandleTx = (networkManager: any, swapEvent: string) => async (txEvent: TransactionEvent) => {
  GMX_ROUTER_ADDRESS = networkManager.get("address");
  const findings: Finding[] = [];
  const swapEvents = txEvent.filterLog(swapEvent);

  //detect calls to the GMX router
  if (txEvent.to == GMX_ROUTER_ADDRESS) {
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
