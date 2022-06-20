import { BigNumber } from "ethers";
import { Finding, HandleTransaction, TransactionEvent, LogDescription, getEthersProvider } from "forta-agent";
import ReservesFetcher from "./reserves.fetcher";
import { createFinding, EVENTS_SIGNATURES, PERCENT, PGL_CONTRACT } from "./utils";

export const provideHandleTransaction =
  (percent: number, fetcher: ReservesFetcher): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // Filter logs to get Burn and Mint event logs
    const logs: LogDescription[] = txEvent.filterLog(EVENTS_SIGNATURES, fetcher.pglAddress);

    // Return empty findings in no log is reported.
    if (logs.length == 0) return findings;

    // Fetch QI-WAVAX reserves.
    const [reserve0, reserve1] = await fetcher.getReserves(txEvent.blockNumber - 1);

    // set threshold values
    const threshold0 = reserve0.mul(percent); // QI threshold
    const threshold1 = reserve1.mul(percent); // WAVAX threshold

    // Loop over the logs
    logs.forEach((log) => {
      // Generate a finding if one of the amounts exceeds the threshold
      if (
        BigNumber.from(log.args.amount0).mul(100).gte(threshold0) ||
        BigNumber.from(log.args.amount1).mul(100).gte(threshold1)
      )
        findings.push(createFinding(log));
    });
    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(PERCENT, new ReservesFetcher(getEthersProvider(), PGL_CONTRACT)),
};
