import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  getJsonRpcUrl,
  Log,
} from 'forta-agent';
import Web3 from 'web3';
import MakerFetcher from './maker.fetcher';
import {
  decodeParameters,
  provideEventCheckerHandler,
} from 'forta-agent-tools';
import TimeTracker from './time.tracker';
import { createFinding, getCollateralType } from './utils';

const web3: Web3 = new Web3(getJsonRpcUrl());
const fetcher = new MakerFetcher(web3);

const address = '0x65C79fcB50Ca1594B025960e539eD7A9a6D434A3';
const eventSignature = 'Poke(bytes32,bytes32,uint256)';

export const providehandleTransaction = (
  web3: Web3,
  fetcher: MakerFetcher
): HandleTransaction => {
  const timeTracker = new TimeTracker();
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const timestamp = txEvent.block.timestamp;
    const makers = await fetcher.getActiveMakers(txEvent.blockNumber);

    const collaterals = makers.map((strategy) => {
      getCollateralType(web3, strategy, txEvent.blockNumber);
    });

    const types = (await Promise.all(collaterals)).flat();

    const filterEvents = (log: Log) => {
      const parameters = decodeParameters(
        ['bytes32', 'bytes32', 'uint256'],
        log.data
      );

      return types.includes(parameters[0]);
    };

    const handler = provideEventCheckerHandler(
      () => {
        return {} as Finding;
      },
      eventSignature,
      address,
      filterEvents
    );

    if (timeTracker.isOutOf3Hours(timestamp)) {
      timeTracker.updateFindingReport(false);
      timeTracker.updateFunctionWasCalled(false);
    }

    if (
      (await handler(txEvent)).length !== 0 &&
      timeTracker.isIn3Hours(timestamp)
    ) {
      timeTracker.updateFunctionWasCalled(true);
    }

    if (
      !timeTracker.isIn3Hours(timestamp) &&
      !timeTracker.isFirstHour(timestamp) &&
      !timeTracker.functionWasCalled &&
      !timeTracker.findingReported
    ) {
      timeTracker.updateFindingReport(true);
      findings.push(createFinding());
    }

    timeTracker.updateHour(timestamp);

    return findings;
  };
};
export default {
  handleTransaction: providehandleTransaction(web3, fetcher),
  providehandleTransaction,
};

/* 
const types = (await Promise.all(collaterals)).flat();
for (const type of types) {
  const filterEvents = (log: Log) => {
    const parameters = decodeParameters(
      ['bytes32', 'bytes32', 'uint256'],
      log.data
    );

    return parameters[0] === type;
  };

  const handler = provideEventCheckerHandler(
    () => {
      return {} as Finding;
    },
    eventSignature,
    address,
    filterEvents
  );

  if (timeTracker.isOutOf3Hours(timestamp)) {
    timeTracker.updateFindingReport(false);
    timeTracker.updateFunctionWasCalled(false);
  }

  if (
    (await handler(txEvent)).length !== 0 &&
    timeTracker.isIn3Hours(timestamp)
  ) {
    timeTracker.updateFunctionWasCalled(true);
  }

  if (
    !timeTracker.isIn3Hours(timestamp) &&
    !timeTracker.isFirstHour(timestamp) &&
    !timeTracker.functionWasCalled &&
    !timeTracker.findingReported
  ) {
    timeTracker.updateFindingReport(true);
    findings.push(createFinding());
  }

  timeTracker.updateHour(timestamp);
} */
