import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  getEthersProvider,
} from "forta-agent";

import { BigNumber, ethers } from "ethers";
import {
  MASTERCHEF_ADDRESS,
  MASTERCHEF_ABI,
  IBEP20_ABI
} from './constants';

import { BotConfig, STATIC_CONFIG, DYNAMIC_CONFIG } from "./config";
import { createFinding } from "./findings";

let findingsCount = 0;

export function provideHandleTransaction(
  config: BotConfig,
) : HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
      
    let findings: Finding[] = [];

    const provider = getEthersProvider();
    const masterchefContract = new ethers.Contract(MASTERCHEF_ADDRESS, MASTERCHEF_ABI, provider);

    await Promise.all(
      // filter the transaction logs for Deposit and withdraw events
      txEvent.filterLog(
        [MASTERCHEF_ABI[0], MASTERCHEF_ABI[1]],
        MASTERCHEF_ADDRESS
      ).map(async (log) => {
        // extract event arguments
        const { user, pid, amount } = log.args;

        // Get the address of the LP token
        var tokenAddress = masterchefContract.lpToken(pid);
        var tokenContract = new ethers.Contract(tokenAddress, IBEP20_ABI, provider);
        var tokenName = await tokenContract.name();

        // Get threshold (check config for whether static or dynamic mode)
        let thresholdAmount: BigNumber;

        if (config.mode === "STATIC") thresholdAmount = config.thresholdData;
        else {
          // Fetch balance of the token in the Masterchef contract
          const balance = await tokenContract.balanceOf(MASTERCHEF_ADDRESS, { blockTag: txEvent.blockNumber - 1 });
          // Set threshold
          thresholdAmount = BigNumber.from(balance).mul(config.thresholdData).div(100);
        }
        
        // If amount is greater than threshold, create finding
        if (amount.gte(thresholdAmount)) {
          findings.push(createFinding(log.name, tokenName, log.args));
        }
        findingsCount++;
      })
    );
    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction(STATIC_CONFIG),
};
