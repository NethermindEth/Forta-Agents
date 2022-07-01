import { BigNumber } from "ethers";
import { Finding, getEthersProvider, HandleTransaction, LogDescription, TransactionEvent } from "forta-agent";
import BalanceFetcher from "./balance.fetcher";
import { BotConfig, DYNAMIC_CONFIG, STATIC_CONFIG } from "./config";
import { createFinding, createSuspiciousFinding } from "./findings";
import NetworkManager, { NETWORK_MAP } from "./network";
import TokenAddressFetcher from "./token.address.fetcher";
import { EVENTS } from "./utils";

const networkManager = new NetworkManager(NETWORK_MAP);
let balanceFetcher = new BalanceFetcher(getEthersProvider(), networkManager);

const provideInitialize = (tokenFetcher: TokenAddressFetcher) => async () => {
  // set data based on networkId.
  const { chainId } = await tokenFetcher.provider.getNetwork();
  networkManager.setNetwork(chainId);

  // get system assetType.
  const systemAssetType = await tokenFetcher.getSystemAssetType("latest");
  // extract system token address.
  const systemToken = await tokenFetcher.extractTokenAddress(systemAssetType, "latest");

  // set balance fetcher data.
  balanceFetcher.setData(systemAssetType, systemToken);
};

export const provideHandleTransaction =
  (config: BotConfig, balanceFetcher: BalanceFetcher): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const logs: LogDescription[] = txEvent.filterLog(EVENTS, balanceFetcher.networkManager.perpetualProxy);

    for (let log of logs) {
      // get the quantizedAmount
      const quantizedAmount: BigNumber = BigNumber.from(log.args.quantizedAmount);

      // get assetType
      const assetType = BigNumber.from(log.args.assetType);
      // if the transaction includes an assetType different from the system's one, generate an alert.
      if (!assetType.eq(balanceFetcher.assetType))
        findings.push(createSuspiciousFinding(log.name, assetType.toHexString(), log.args));
      else {
        let _threshold: BigNumber;
        if (config.mode === "STATIC") _threshold = config.thresholdData;
        else {
          // fetch token balance of the contract then set threshold.
          const totalBalance: BigNumber = await balanceFetcher.getBalance(txEvent.blockNumber - 1);
          _threshold = BigNumber.from(totalBalance).mul(config.thresholdData).div(100);
        }
        // is quantizedAmount exceeds the threshold, generates a finding.
        if (quantizedAmount.gte(_threshold))
          findings.push(createFinding(log.name, balanceFetcher.tokenAddress, log.args));
      }
    }

    return findings;
  };

export default {
  initialize: provideInitialize(new TokenAddressFetcher(getEthersProvider(), networkManager)),
  handleTransaction: provideHandleTransaction(STATIC_CONFIG, balanceFetcher),
};
