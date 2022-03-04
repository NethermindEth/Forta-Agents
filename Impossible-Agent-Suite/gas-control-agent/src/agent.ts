import { Finding, HandleTransaction, TransactionEvent } from 'forta-agent';
import utils, { AddressValidator } from './utils';
import { BigNumber } from 'ethers';

const THRESHOLD: BigNumber = BigNumber.from(10); // gas price
const DECIMALS: BigNumber = BigNumber.from(10).pow(9);

export const provideHandleTransaction = (
  isValid: AddressValidator, 
  _threshold: BigNumber,
): HandleTransaction => {
  const threshold: BigNumber = _threshold.mul(DECIMALS);

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const gasPrice: BigNumber = BigNumber.from(txEvent.gasPrice);

    const addrs: string[] = Object.keys(txEvent.addresses);
    const valid: boolean[] = await Promise.all(addrs.map(addr => isValid(addr)));
    const involved: string[] = addrs.filter((_, idx) => valid[idx]);

    if (involved.length && threshold.lt(gasPrice)) 
      findings.push(utils.createFinding(involved, gasPrice));

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(
    utils.isOnContractList,
    THRESHOLD,
  ),
  provideHandleTransaction,
};
