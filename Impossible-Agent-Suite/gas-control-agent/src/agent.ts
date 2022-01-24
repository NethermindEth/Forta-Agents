import BigNumber from 'bignumber.js';
import { Finding, HandleTransaction, TransactionEvent } from 'forta-agent';
import { CONTRACTS, createFinding } from './utils';

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  const th = new BigNumber(10); // 10 GWei
  const gasPrice = new BigNumber(txEvent.gasPrice).div(
    new BigNumber(10).pow(9)
  );

  CONTRACTS.map((contract) => {
    if (txEvent.to === contract && gasPrice.gt(th)) {
      findings.push(createFinding(contract, gasPrice.toString()));
    }
  });

  return findings;
};

export default {
  handleTransaction,
};
