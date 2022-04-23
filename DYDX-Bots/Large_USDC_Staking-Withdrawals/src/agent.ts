import { Finding, HandleTransaction, TransactionEvent, getEthersProvider } from "forta-agent";
import { BigNumber } from "ethers";
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

const USDC_BAL_FETCHER: BalanceFetcher = new BalanceFetcher(getEthersProvider(), USDC_ADDRESS);

export function provideHandleTransaction(
  proxyAddress: string,
  fetcher: BalanceFetcher,
  thresholdPercentage: number
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    txEvent.filterLog([STAKED_ABI, WITHDREW_STAKE_ABI, WITHDREW_DEBT_ABI], proxyAddress).forEach(async (log) => {
      const proxyBalance: BigNumber = BigNumber.from(await fetcher.getBalanceOf(proxyAddress, "latest"));
      // NOTE: ^ CALLING getBalanceOf WITH THE "latest" BLOCK WILL GET YOU THE BALANCE AFTER
      // THE TRANSACTION HAS TAKEN PLACE. CALL IT WITH blocNumber -1?

      // If amount is greater than or equal to half of
      // the token balance of the proxy contract.
      if (log.args.amount.gte(proxyBalance.mul(thresholdPercentage / 100))) {
        findings.push(createFinding(log.name, log.args));
      }
    });

    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction(PROXY_ADDRESS, USDC_BAL_FETCHER, THRESHOLD_PERCENTAGE),
};
