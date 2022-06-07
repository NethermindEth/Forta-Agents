import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { WITHDRAW_ABI, DEPOSIT_ABI } from "./constants";
import { AgentConfig, createFinding, ethersBnToBn } from "./utils";
import CONFIG from "./agent.config";
import Fetcher from "./price.fetcher";

export const provideHandleTransaction = (fetcher: Fetcher, config: AgentConfig): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const logs = txEvent.filterLog([DEPOSIT_ABI, WITHDRAW_ABI], config.lendingPoolAddress);

    if (!logs.length) return [];

    const ethPrice = await fetcher.getEthPrice(txEvent.blockNumber, config.ethUsdFeedAddress);

    await Promise.all(
      logs.map(async (log) => {
        const amount = ethersBnToBn(log.args.amount, 6);

        const assetPrice = await fetcher.getAssetPrice(config.umeeOracleAddress, log.args.reserve, txEvent.blockNumber);

        const totalValue = assetPrice.times(ethPrice).times(amount);

        if (totalValue.gte(config.threshold)) {
          findings.push(createFinding(log, totalValue.toString()));
        }
      })
    );

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(new Fetcher(getEthersProvider()), CONFIG),
};
