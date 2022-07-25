import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";

import { BigNumber, ethers } from "ethers";
import { MASTERCHEF_ADDRESS, MASTERCHEF_ABI } from "./constants";

import { BotConfig, STATIC_CONFIG, DYNAMIC_CONFIG } from "./config";
import MasterchefFetcher from "./masterchef.fetcher";
import TokenFetcher from "./token.fetcher";
import { createFinding } from "./findings";


export function provideHandleTransaction(
  config: BotConfig,
  provider: ethers.providers.Provider,
  masterchefFetcher: MasterchefFetcher,
  masterchefAddress: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];

    await Promise.all(
      // filter the transaction logs for Deposit and withdraw events
      txEvent
        .filterLog([MASTERCHEF_ABI[0], MASTERCHEF_ABI[1], MASTERCHEF_ABI[2]], masterchefAddress)
        .map(async (log) => {
          // extract event arguments
          const { pid, amount } = log.args;

          // Get the address of the LP token, instantiate Fetcher and get token name
          const tokenAddress = await masterchefFetcher.getLPToken(pid, txEvent.blockNumber);
          const tokenFetcher = new TokenFetcher(provider, tokenAddress);
          const tokenName = await tokenFetcher.getName(txEvent.blockNumber);

          // Get threshold (check config for whether static or dynamic mode)
          let thresholdAmount: BigNumber;

          if (config.mode === "STATIC") thresholdAmount = config.thresholdData;
          else {
            // Fetch balance of the token in the Masterchef contract
            const balance = await tokenFetcher.getBalanceOf(masterchefAddress, txEvent.blockNumber - 1)
            // Set threshold
            thresholdAmount = BigNumber.from(balance).mul(config.thresholdData).div(100);
          }
          // If amount is greater than threshold, create finding
          if (amount.gte(thresholdAmount)) {
            findings.push(createFinding(log.name, tokenName, log.args));
          }
        })
    );
    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction(
    DYNAMIC_CONFIG, 
    getEthersProvider(), 
    new MasterchefFetcher(getEthersProvider(), MASTERCHEF_ADDRESS),
    MASTERCHEF_ADDRESS
  )
};
