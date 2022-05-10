import { BigNumber, providers } from "ethers";
import {
  Finding,
  getEthersProvider,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import BalanceFetcher from "./balance.fetcher";
import InactiveBalanceFetcher from "./inactive.balance.fetcher";
import { createFinding, EVENT_SIGNATURE } from "./utils";
import { BotConfig, DYNAMIC_CONFIG, STATIC_CONFIG } from "./config";
import NetworkData from "./network";
import NetworkManager from "./network";

const networkManager = new NetworkManager();
const balanceFetcher = new BalanceFetcher(getEthersProvider(), networkManager);
const inactiveBalanceFetcher = new InactiveBalanceFetcher(
  getEthersProvider(),
  networkManager
);

export const provideInitialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
  balanceFetcher.setTokenContract();
  inactiveBalanceFetcher.setSafetyModule();
};

export const provideHandleTransaction =
  (
    config: BotConfig,
    networkManager: NetworkData,
    inactiveBalanceFetcher: InactiveBalanceFetcher,
    balanceFetcher: BalanceFetcher
  ): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    await Promise.all(
      txEvent
        .filterLog(EVENT_SIGNATURE, networkManager.safetyModule)
        .map(async (log) => {
          // get the staker address
          const staker = log.args.staker;

          // get the staker inactive balance.
          const inactiveBalance =
            await inactiveBalanceFetcher.getInactiveBalance(
              staker,
              txEvent.blockNumber
            );

          // set threshold based on the mode.
          let _threshold: BigNumber;

          if (config.mode === "STATIC") _threshold = config.thresholdData;
          else {
            // fetch total staked tokens.
            const totalStaked = await balanceFetcher.getBalance(
              txEvent.blockNumber
            );

            // set threshold
            _threshold = BigNumber.from(totalStaked)
              .mul(config.thresholdData)
              .div(100);
          }

          if (inactiveBalance.gte(_threshold))
            findings.push(createFinding(config.mode, staker, inactiveBalance));
        })
    );

    return findings;
  };

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(
    DYNAMIC_CONFIG,
    networkManager,
    inactiveBalanceFetcher,
    balanceFetcher
  ),
};
