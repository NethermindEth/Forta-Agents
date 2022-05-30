import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import utils, { AddressValidator, THRESHOLD } from "./utils";
import { BigNumber, ethers } from "ethers";

export const provideHandleTransaction = (isValid: AddressValidator, _threshold: BigNumber): HandleTransaction => {
  const threshold: BigNumber = ethers.utils.parseUnits(_threshold.toString(), "gwei");

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const gasPrice: BigNumber = BigNumber.from(txEvent.gasPrice);

    if (threshold.lt(gasPrice)) {
      const addrs: string[] = Object.keys(txEvent.addresses);
      const valid: boolean[] = await Promise.all(addrs.map((addr) => isValid(addr)));
      const involved: string[] = addrs.filter((_, idx) => valid[idx]);

      if (involved.length) findings.push(utils.createFinding(involved, gasPrice, _threshold));
    }
    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(utils.isOnContractList, THRESHOLD),
  provideHandleTransaction,
};
