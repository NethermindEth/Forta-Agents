import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { BigNumber, providers } from "ethers";
import NetworkManager, { NETWORK_MAP } from "./network";
import NetworkData from "./network";
import BalanceFetcher from "./balance.fetcher";
import { BotConfig, STATIC_CONFIG, DYNAMIC_CONFIG } from "./config";
import { STAKED_ABI, WITHDREW_STAKE_ABI, WITHDREW_DEBT_ABI } from "./utils";
import { createFinding } from "./findings";

const networkManager: NetworkData = new NetworkManager(NETWORK_MAP);
const balanceFetcher: BalanceFetcher = new BalanceFetcher(getEthersProvider(), networkManager);

export const provideInitialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
  balanceFetcher.setUsdcContract();
};

export function provideHandleTransaction(
  config: BotConfig,
  networkManager: NetworkData,
  balanceFetcher: BalanceFetcher
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];

    await Promise.all(
      txEvent
        .filterLog([STAKED_ABI, WITHDREW_STAKE_ABI, WITHDREW_DEBT_ABI], networkManager.liquidityModule)
        .map(async (log) => {
          // set threshold based on mode.
          let thresholdAmount: BigNumber;

          if (config.mode === "STATIC") thresholdAmount = config.thresholdData;
          else {
            // Get the stake token balance of the module contract at the previous block
            // (before the transaction, and the subsequent event emission)
            const moduleBalance: BigNumber = await balanceFetcher.getBalanceOf(
              networkManager.liquidityModule,
              txEvent.blockNumber - 1
            );

            // Find the threshold amount from the percentage
            thresholdAmount = moduleBalance.mul(config.thresholdData).div(100);
          }

          // If `amount` is greater than the threshold,
          // create a Finding
          if (log.args.amount.gte(thresholdAmount)) {
            findings.push(createFinding(log.name, log.args));
          }
        })
    );

    return findings;
  };
}

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(STATIC_CONFIG, networkManager, balanceFetcher),
};
