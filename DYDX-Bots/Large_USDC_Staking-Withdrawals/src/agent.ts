import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { BigNumber, providers } from "ethers";
import NetworkData from "./network";
import NetworkManager from "./network";
import BalanceFetcher from "./balance.fetcher";
import {
  PROXY_ADDRESS,
  STAKED_ABI,
  WITHDREW_STAKE_ABI,
  WITHDREW_DEBT_ABI,
  USDC_ADDRESS,
  THRESHOLD_PERCENTAGE,
} from "./utils";
import { createFinding } from "./findings";

const networkManager = new NetworkManager();

export const provideInitialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

const USDC_BAL_FETCHER: BalanceFetcher = new BalanceFetcher(getEthersProvider(), networkManager);

export function provideHandleTransaction(
  networkManager: NetworkData,
  fetcher: BalanceFetcher,
  thresholdPercentage: number
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];

    await Promise.all(
      txEvent.filterLog([STAKED_ABI, WITHDREW_STAKE_ABI, WITHDREW_DEBT_ABI], networkManager.liquidityModule).map(async (log) => {
        // Get the stake token balance of the proxy contract at the previous block
        // (before the transaction, and subsequent event emission ocurred)
        const proxyBalance: BigNumber = BigNumber.from(
          await fetcher.getBalanceOf(networkManager.liquidityModule, txEvent.blockNumber - 1)
        );

        // Find the threshold amount from the percentage
        const thresholdAmount: BigNumber = proxyBalance.mul(thresholdPercentage);

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
  handleTransaction: provideHandleTransaction(networkManager, USDC_BAL_FETCHER, THRESHOLD_PERCENTAGE),
};
