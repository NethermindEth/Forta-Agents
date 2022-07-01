import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { BigNumber, providers } from "ethers";
import NetworkManager, { NETWORK_MAP } from "./network";
import NetworkData from "./network";
import BalanceFetcher from "./balance.fetcher";
import { createFinding } from "./findings";
import { APPROVAL_EVENT, THRESHOLD_PERCENTAGE } from "./utils";

const networkManager: NetworkData = new NetworkManager(NETWORK_MAP);
const balanceFetcher: BalanceFetcher = new BalanceFetcher(getEthersProvider(), networkManager);

export const provideInitialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
  balanceFetcher.setTokensContract();
};

export function provideHandleTransaction(
  networkManager: NetworkData,
  balanceFetcher: BalanceFetcher,
  thresholdPercentage: number
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];
    let liquidityModuleBalance: BigNumber;
    let safetyModuleBalance: BigNumber;
    let isLiquidityBalanceFetched = false;
    let isSafetyBalanceFetched = false;

    await Promise.all(
      // Listen to approval events on both Safety and Liquidity module.
      txEvent
        .filterLog(APPROVAL_EVENT, [networkManager.liquidityModule, networkManager.safetyModule])
        .map(async (log) => {
          if (log.address.toLowerCase() === networkManager.liquidityModule.toLowerCase()) {
            // Check if the liquidity module balance is already fetched for this block.
            if (!isLiquidityBalanceFetched) {
              liquidityModuleBalance = await balanceFetcher.getUsdcBalanceOf(
                networkManager.liquidityModule,
                txEvent.blockNumber - 1
              );
              isLiquidityBalanceFetched = true;
            }

            // Generate a finding if the approved value exceeds the threshold
            if (log.args.value.mul(100).gte(liquidityModuleBalance.mul(thresholdPercentage)))
              findings.push(createFinding(log.args, "Liquidity Module"));
          } else {
            // Check if the safety module balance is already fetched for this block.
            if (!isSafetyBalanceFetched) {
              safetyModuleBalance = await balanceFetcher.getDydxBalanceOf(
                networkManager.safetyModule,
                txEvent.blockNumber - 1
              );
              isSafetyBalanceFetched = true;
            }

            // Generate a finding if the approved value exceeds the threshold
            if (log.args.value.mul(100).gte(safetyModuleBalance.mul(thresholdPercentage)))
              findings.push(createFinding(log.args, "Safety Module"));
          }
        })
    );

    return findings;
  };
}

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager, balanceFetcher, THRESHOLD_PERCENTAGE),
};
