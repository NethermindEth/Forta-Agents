import { Finding, getEthersProvider, HandleTransaction, TransactionEvent } from "forta-agent";
import { createFinding } from "./findings";
import SuppliesFetcher from "./supplies.fetcher";
import { FUNCTION_SIGNATURES, PGL_STAKING_CONTRACT, THRESHOLD_PERCENTAGE } from "./utils";

export const provideHandleTransaction =
  (threshold_percentage: number, fetcher: SuppliesFetcher): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // get `deposit` and `redeem` calls in PGL staking contract.
    const calls = txEvent.filterFunction(FUNCTION_SIGNATURES, fetcher.pglStakingAddress);

    // Loop over calls
    await Promise.all(
      calls.map(async (call) => {
        // get the pglAmount that was deposited / redeemed.
        const pglAmount = call.args.pglAmount;

        // fetch the total staked PGL and compute the threshold.
        const totalSupplies = await fetcher.getTotalSupplies(txEvent.blockNumber - 1);
        const threshold = totalSupplies.mul(threshold_percentage);

        // create a finding if the amount exceeds the threshold.
        if (threshold.lte(pglAmount.mul(100))) findings.push(createFinding(call.name, pglAmount, txEvent.from));
      })
    );
    // return the findings
    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(
    THRESHOLD_PERCENTAGE,
    new SuppliesFetcher(getEthersProvider(), PGL_STAKING_CONTRACT)
  ),
};
