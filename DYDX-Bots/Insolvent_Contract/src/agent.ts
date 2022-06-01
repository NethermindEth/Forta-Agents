import { BlockEvent, Finding, HandleBlock, getEthersProvider } from "forta-agent";
import { BigNumber, providers } from "ethers";
import NetworkManager, { NETWORK_MAP } from "./network";
import BalanceFetcher from "./balance.fetcher";
import { THRESHOLD_AMOUNT } from "./utils";
import { createFinding } from "./findings";

const networkManager = new NetworkManager(NETWORK_MAP);
const balanceFetcher: BalanceFetcher = new BalanceFetcher(getEthersProvider(), networkManager);

export const provideInitialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
  balanceFetcher.setModuleContract();
};

export function provideHandleBlock(fetcher: BalanceFetcher, threshold: BigNumber): HandleBlock {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const [totalBorrowerDebtBalance, totalActiveBalanceCurrentEpoch] = await Promise.all([
      fetcher.getTotalBorrowerDebtBalance(blockEvent.blockNumber),
      fetcher.getTotalActiveBalanceCurrentEpoch(blockEvent.blockNumber),
    ]);

    // If the difference between `totalBorrowerDebtBalance` and `totalActiveBalanceCurrentEpoch`
    // is greater than the static threshold, create a finding
    if (threshold.lt(totalBorrowerDebtBalance.sub(totalActiveBalanceCurrentEpoch))) {
      findings.push(createFinding(totalBorrowerDebtBalance, totalActiveBalanceCurrentEpoch));
    }

    return findings;
  };
}

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleBlock: provideHandleBlock(balanceFetcher, THRESHOLD_AMOUNT),
};
