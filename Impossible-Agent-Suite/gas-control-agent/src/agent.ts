import BigNumber from 'bignumber.js';
import { Finding, HandleTransaction, TransactionEvent } from 'forta-agent';
import { CONTRACTS, createFinding, hexToNumber } from './utils';

export const provideHandleTransaction = (
  contracts: string[]
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const th = new BigNumber(10); // 10 GWei
    const gasPrice = hexToNumber(txEvent.gasPrice);

    contracts.map((contract) => {
      if (txEvent.to === contract && gasPrice.gt(th)) {
        findings.push(createFinding(contract, gasPrice.toString()));
      }
    });

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(CONTRACTS),
  provideHandleTransaction,
};
