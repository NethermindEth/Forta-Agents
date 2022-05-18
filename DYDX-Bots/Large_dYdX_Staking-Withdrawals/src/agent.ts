import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { BigNumber, providers } from "ethers";
import NetworkManager, { NETWORK_MAP } from "./network";
import NetworkData from "./network";
import { STAKED_ABI, WITHDREW_STAKE_ABI, THRESHOLD_STATIC_AMOUNT } from "./utils";

const networkManager: NetworkData = new NetworkManager(NETWORK_MAP);
// const balanceFetcher: BalanceFetcher = new BalanceFetcher(getEthersProvider(), networkManager);

export const provideInitialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
  // balanceFetcher.setUsdcContract();
};

export function provideHandleTransaction(
  networkManager: NetworkData//,
  // balanceFetcher: BalanceFetcher,
  // thresholdPercentage: number
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];

    await Promise.all(
      txEvent
        .filterLog([STAKED_ABI, WITHDREW_STAKE_ABI], networkManager.safetyModule)
        .map(async (log) => {
          // Get the stake token balance of the module contract at the previous block
          // (before the transaction, and the subsequent event emission)
          const moduleBalance: BigNumber = await balanceFetcher.getBalanceOf(
            networkManager.safetyModule,
            txEvent.blockNumber - 1
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
  handleTransaction: provideHandleTransaction(networkManager/*, balanceFetcher, THRESHOLD_PERCENTAGE*/)
};
