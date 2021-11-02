import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getJsonRpcUrl,
} from 'forta-agent';
import Web3 from 'web3';
import MakerFetcher from './maker.fetcher';

const web3: Web3 = new Web3(getJsonRpcUrl());
const fetcher = new MakerFetcher(web3);

const provideHandleTransaction = (web3: Web3) => {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    await fetcher.getVaults(txEvent.blockNumber);

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(web3),
  provideHandleTransaction,
};
