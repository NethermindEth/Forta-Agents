import {
  Finding,
  FindingType,
  FindingSeverity,
  TransactionEvent,
  HandleTransaction,
  getEthersProvider,
} from "forta-agent";

import { ethers } from "ethers";

import { COMPTROLLER_IFACE, QITOKEN_IFACE } from "./abi";

import { createFinding } from "./finding";

const COMPTROLLER_ADDR = "0x486Af39519B4Dc9a7fCcd318217352830E8AD9b4";

const THRESHOLD_PERCENTAGE = 0.001;

// Array to track the QiToken pools
let QITOKENS: Set<string> = new Set<string>();

export const getTotalSupply = async (qiToken: string, blockNumber: any) => {
  // Create an ethers contract instance to query on-chain data
  const qiTokenContract = new ethers.Contract(
    qiToken,
    QITOKEN_IFACE.format(ethers.utils.FormatTypes.full),
    getEthersProvider()
  );
  return await qiTokenContract.totalSupply({ blockTag: blockNumber });
}

export const initialize = async (comptrollerAddr: string) => {
  // Setup a contract interface for the Comptroller contract
  const comptrollerContract = new ethers.Contract(
    COMPTROLLER_ADDR,
    [COMPTROLLER_IFACE.getFunction("getAllMarkets").format("full")],
    getEthersProvider()
  );
  // Get all QiTokens
  const qiTokens = await comptrollerContract.getAllMarkets();
  // Add each qiToken to the set `QITOKENS`
  qiTokens.forEach((qiToken: string) => {
    QITOKENS.add(qiToken.toLowerCase());
  });
}

export const provideHandleTransaction = (
  qiTokensSet: Set<string>,
  getTotalSupply: any,
  thresholdPercentage: number,
  comptrollerAddr: string
): HandleTransaction => {
  return async (tx: TransactionEvent): Promise<Finding[]> => {
    // Set up the findings array
    const findings: Finding[] = [];

    // Check if any new QiTokens have been added to Comptroller
    const qiTokenAdds = tx.filterLog(COMPTROLLER_IFACE.getEvent("MarketListed").format("full"), comptrollerAddr);
    qiTokenAdds.forEach((qiTokenAdd) => {
      qiTokensSet.add(qiTokenAdd.args.qiToken.toLowerCase());
    });

    // Convert the QiToken set into an array
    const qiTokens: string[] = Array.from(qiTokensSet);

    // For each QiToken
    await Promise.all(
      qiTokens.map(async (qiToken) => {
        // Get all `Redeem` events from QiTokens
        const redeems = tx.filterLog(QITOKEN_IFACE.getEvent("Redeem").format("full"), qiToken);
        // For each `Redeem` event
        await Promise.all(
          redeems.map(async (redeem) => {
            // Get the number of tokens redeemed
            const redeemTokens = redeem.args.redeemTokens;
            // Get the total supply from the previous block
            const totalSupply = await getTotalSupply(qiToken, tx.blockNumber - 1);
            // If the amount of tokens redeemed is more than `thresholdPercentage` of `totalSupply`
            if (totalSupply.div(redeemTokens).lt(1 / thresholdPercentage)) {
              findings.push(createFinding(qiToken, totalSupply.toString(), redeemTokens.toString()));
            }
          })
        );
      })
    );

    // Return all findings
    return findings;
  };
};

export default {
  initialize: initialize,
  handleTransaction: provideHandleTransaction(QITOKENS, getTotalSupply, THRESHOLD_PERCENTAGE, COMPTROLLER_ADDR),
};
