import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  getJsonRpcUrl,
  Log,
  FindingSeverity,
  FindingType,
} from 'forta-agent';
import Web3 from 'web3';
import MakerFetcher from './maker.fetcher';
import {
  decodeParameters,
  provideEventCheckerHandler,
} from 'forta-agent-tools';
import TimeTracker from './time.tracker';

const web3: Web3 = new Web3(getJsonRpcUrl());
const fetcher = new MakerFetcher(web3);

export const SPOT_ADDRESS = '0x65C79fcB50Ca1594B025960e539eD7A9a6D434A3';
export const POKE_SIGNATURE = 'Poke(bytes32,bytes32,uint256)';

export const createFinding = (spot: string): Finding => {
  return Finding.fromObject({
    name: 'poke() NOT called detection',
    description:
      "poke() function is not called for several hours with MAKER strategy's ilk",
    severity: FindingSeverity.High,
    type: FindingType.Info,
    alertId: 'Yearn-3-2',
    protocol: 'Yearn',
    metadata: {
      spot: spot,
    },
  });
};

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
      return fetcher.getCollateralType(strategy, txEvent.blockNumber);
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
      () => createFinding(SPOT_ADDRESS),
      POKE_SIGNATURE,
      SPOT_ADDRESS,
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
      (!timeTracker.isIn3Hours(timestamp) &&
        !timeTracker.isFirstHour(timestamp) &&
        !timeTracker.functionWasCalled &&
        !timeTracker.findingReported) ||
      !txEvent.status
    ) {
      timeTracker.updateFindingReport(true);
      findings.push(createFinding(SPOT_ADDRESS));
    }

    timeTracker.updateHour(timestamp);
    return findings;
  };
};
export default {
  handleTransaction: providehandleTransaction(web3, fetcher),
  providehandleTransaction,
};
