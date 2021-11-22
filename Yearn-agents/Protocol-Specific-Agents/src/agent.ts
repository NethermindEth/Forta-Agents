import {
  Finding,
  TransactionEvent,
  getJsonRpcUrl,
  HandleTransaction,
} from 'forta-agent';

import Web3 from 'web3';
import MakerFetcher from './maker.fetcher';
import provideOSMPriceHandler from './OSM.price.handler';
import provideStabilityFeeHandler from './stability.handler';
import provideStaleSpotPriceHandler from './stale.spot.price.handler';
import TimeTracker from './time.tracker';
import { OSM_CONTRACTS } from './utils';

const web3: Web3 = new Web3(getJsonRpcUrl());
const fetcher = new MakerFetcher(web3);

export const provideHandleTransaction = (
  web3: Web3,
  fetcher: MakerFetcher
): HandleTransaction => {
  const timeTracker = new TimeTracker();
  return async (txEvent: TransactionEvent) => {
    let findings: Finding[] = [];
    const makers = await fetcher.getActiveMakers(txEvent.blockNumber);

    if (makers) {
      const handlerCalls = [
        provideStabilityFeeHandler(web3, makers, txEvent),
        provideStaleSpotPriceHandler(web3, makers, txEvent, timeTracker),
      ];

      const finding = await Promise.all(handlerCalls);
      findings = findings.concat(...finding);
    }

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(web3, fetcher),
  handleBlock: provideOSMPriceHandler(web3, OSM_CONTRACTS),
  provideHandleTransaction,
  provideOSMPriceHandler,
};
