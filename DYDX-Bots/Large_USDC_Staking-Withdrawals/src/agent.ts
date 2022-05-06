import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { BigNumber, providers } from "ethers";
import NetworkManager from "./network";
import BalanceFetcher from "./balance.fetcher";
import { STAKED_ABI, WITHDREW_STAKE_ABI, WITHDREW_DEBT_ABI, THRESHOLD_PERCENTAGE } from "./utils";
import { createFinding } from "./findings";

let data: any = {
  networkManager: new NetworkManager(),
};

export const provideInitialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  data.networkManager.setNetwork(chainId);
  data.balanceFetcher = new BalanceFetcher(getEthersProvider(), data.networkManager);
};

export function provideHandleTransaction(data: any, thresholdPercentage: number): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];

    await Promise.all(
      txEvent
        .filterLog([STAKED_ABI, WITHDREW_STAKE_ABI, WITHDREW_DEBT_ABI], data.networkManager.liquidityModule)
        .map(async (log) => {
          // Get the stake token balance of the module contract at the previous block
          // (before the transaction, and the subsequent event emission)
          const moduleBalance: BigNumber = BigNumber.from(
            await data.balanceFetcher.getBalanceOf(data.networkManager.liquidityModule, txEvent.blockNumber - 1)
          );

          // Find the threshold amount from the percentage
          const thresholdAmount: BigNumber = moduleBalance.mul(thresholdPercentage);

          // If `amount` is greater than the threshold,
          // create a Finding
          if (thresholdAmount.lte(log.args.amount.mul(100))) {
            findings.push(createFinding(log.name, log.args));
          }
        })
    );

    return findings;
  };
}

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(
    data,
    THRESHOLD_PERCENTAGE
  ),
};
