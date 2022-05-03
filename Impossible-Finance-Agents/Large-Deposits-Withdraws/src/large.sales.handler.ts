import { BigNumber } from "ethers";
import { Finding, LogDescription, TransactionEvent } from "forta-agent";
import SalesFetcher from "./sales.fetcher";
import {
  createSaleFinding,
  PERCENT,
  PURCHASE_SIGNATURE,
  WITHDRAW_SIGNATURE,
} from "./utils";

export const saleHandler = async (
  sale_contracts: string[],
  txEvent: TransactionEvent,
  fetcher: SalesFetcher
): Promise<Finding[]> => {
  const findings: Finding[] = [];
  const logs: LogDescription[] = [];

  sale_contracts.forEach((sale_contract) =>
    logs.push(
      ...txEvent.filterLog(
        [PURCHASE_SIGNATURE, WITHDRAW_SIGNATURE],
        sale_contract
      )
    )
  );

  const contractsInUse: Set<string> = new Set<string>(
    logs.map((log: LogDescription) => log.address.toLowerCase())
  );

  const thresholds: Record<string, BigNumber> = {};
  const thresholdsPromises: Promise<BigNumber>[] = [];

  contractsInUse.forEach((contract: string) => {
    thresholdsPromises.push(
      fetcher
        .getTotalPaymentReceived(txEvent.blockNumber - 1, contract)
        .then(
          (total: BigNumber) =>
            (thresholds[contract] = total.mul(PERCENT).div(100))
        )
    );
  });
  await Promise.all(thresholdsPromises);

  for (let i = 0; i < logs.length; i++) {
    if (thresholds[logs[i].address.toLowerCase()].lte(logs[i].args[1])) {
      findings.push(createSaleFinding(logs[i], "IMPOSSIBLE-4-2"));
    }
  }
  return findings;
};

export default {
  saleHandler,
};
