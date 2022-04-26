import { BigNumber } from "ethers";
import {
  Finding,
  getEthersProvider,
  HandleTransaction,
  LogDescription,
  TransactionEvent,
} from "forta-agent";
import BalanceFetcher from "./balance.fetcher";
import { createFinding } from "./findings";
import { EVENTS, extractTokenAddress, PERPETUAL_CONTRACT } from "./utils";

const PERCENTAGE: BigNumber = BigNumber.from(10);
const THRESHOLD: BigNumber = BigNumber.from(1000000).mul(10 ** 6); // 1M tokens threshold
// Use the threshold below for test transactions
//const THRESHOLD: BigNumber = BigNumber.from(100000).mul(10 ** 6);

export const provideHandleTransaction =
  (
    mode: string,
    threshold: BigNumber,
    fetcher: BalanceFetcher
  ): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const logs: LogDescription[] = txEvent.filterLog(
      EVENTS,
      fetcher.perpetualAddress
    );

    for (let log of logs) {
      // get the quantizedAmount
      const quantizedAmount: BigNumber = BigNumber.from(
        log.args.quantizedAmount
      );
      console.log(quantizedAmount.toNumber());
      // get assetType
      const assetType = BigNumber.from(log.args.assetType);
      // extract the token address from asset Type. Can Be ETH too.
      // TODO: Complete extractTokenAddress function logic.
      // const token = await extractTokenAddress(assetType, fetcher.provider);

      // set the threshold.
      let _threshold: BigNumber;
      if (mode === "STATIC") _threshold = threshold;
      else {
        const token = await extractTokenAddress(assetType, fetcher.provider);

        // fetch token balance of the contract and set threshold
        const totalBalance: BigNumber = await fetcher.getBalance(
          token,
          txEvent.blockNumber - 1
        );
        _threshold = BigNumber.from(totalBalance).mul(threshold).div(100);
      }

      if (quantizedAmount.gte(_threshold))
        findings.push(
          createFinding(log.name, assetType.toHexString(), log.args)
        );
    }

    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(
    "STATIC",
    THRESHOLD,
    new BalanceFetcher(getEthersProvider(), PERPETUAL_CONTRACT)
  ),
};
