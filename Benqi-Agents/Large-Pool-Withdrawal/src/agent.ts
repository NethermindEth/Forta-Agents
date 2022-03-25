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

// The threshold for generating findings
// The percentage is shown in decimal form. EG: 25% = 25
const THRESHOLD_PERCENTAGE = 20;

// Array to track the QiToken pools
let QITOKENS: string[] = [];

export const getTotalSupply = async (qiToken: string, blockNumber: any) => {
  // Create an ethers contract instance to query on-chain data
  const qiTokenContract = new ethers.Contract(
    qiToken,
    QITOKEN_IFACE.format(ethers.utils.FormatTypes.full),
    getEthersProvider()
  );
  return await qiTokenContract.totalSupply({ blockTag: blockNumber });
};

export const initialize = async (comptrollerAddr: string) => {
  // Setup a contract interface for the Comptroller contract
  const comptrollerContract = new ethers.Contract(
    COMPTROLLER_ADDR,
    [COMPTROLLER_IFACE.getFunction("getAllMarkets").format("full")],
    getEthersProvider()
  );
  // Get all QiTokens
  let tokens = await comptrollerContract.getAllMarkets();
  QITOKENS.push(...tokens);
};

export const provideHandleTransaction = (
  qiTokens: string[],
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
      qiTokens.push(qiTokenAdd.args.qiToken.toLowerCase());
    });

    // Get all `Redeem` logs from all QiToken addresses
    const logs = tx.filterLog(QITOKEN_IFACE.getEvent("Redeem").format("full"), qiTokens);

    // For each log
    await Promise.all(
      logs.map(async (log) => {
        // Get the number of tokens redeemed
        const redeemTokens = log.args.redeemTokens;
        // Get the total supply from the previous block
        const totalSupply = await getTotalSupply(log.address, tx.blockNumber - 1);
        // If the amount of tokens redeemed is more `thresholdPercentage` of `totalSupply`
        if (redeemTokens.gte(totalSupply.mul(thresholdPercentage).div(100))) {
          // Generate a finding
          findings.push(createFinding(log.address, totalSupply.toString(), redeemTokens.toString()));
        }
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
