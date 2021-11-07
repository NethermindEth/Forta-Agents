import {
  Finding,
  TransactionEvent,
  getJsonRpcUrl,
  Log,
} from 'forta-agent';
import {
  decodeParameters,
  provideEventCheckerHandler,
  provideFunctionCallsDetectorHandler,
} from 'forta-agent-tools';
import Web3 from 'web3';
import MakerFetcher from './maker.fetcher';
import TimeTracker from './time.tracker';
import {
  createFindingStabilityFee,
  createStaleSpotFinding,
  getCollateralType,
  JUG_CONTRACT,
  JUG_DRIP_FUNCTION_SIGNATURE,
  POKE_SIGNATURE,
  SPOT_ADDRESS,
} from './utils';

const web3: Web3 = new Web3(getJsonRpcUrl());
const fetcher = new MakerFetcher(web3);

// The Handler that checks Stability Fee changes for Maker Strategies
const provideStabilityFeeHandler = async (
  web3: Web3,
  makers: string[],
  txEvent: TransactionEvent
): Promise<Finding[]> => {
  const findings: Finding[] = [];

  if (!txEvent.status) return [];

  for (const strategy of makers) {
    const collateralType = await getCollateralType(
      web3,
      strategy,
      txEvent.blockNumber
    );

    const filterOnArguments = (args: { [key: string]: any }): boolean => {
      return args[0] === collateralType;
    };

    const agentHandler = provideFunctionCallsDetectorHandler(
      createFindingStabilityFee(strategy.toString()),
      JUG_DRIP_FUNCTION_SIGNATURE,
      { to: JUG_CONTRACT, filterOnArguments }
    );

    findings.push(...(await agentHandler(txEvent)));
  }

  return findings;
};

// The Handler that checks poke() method is not called for >= 3 hours
const provideStaleSpotPriceHandler = async (
  web3: Web3,
  makers: string[],
  txEvent: TransactionEvent,
  timeTracker: TimeTracker
): Promise<Finding[]> => {
  const findings: Finding[] = [];
  const timestamp = txEvent.block.timestamp;

  for (const strategy of makers) {
    const ilk = await getCollateralType(web3, strategy, txEvent.blockNumber);

    const filterEvents = (log: Log) => {
      const parameters = decodeParameters(
        ['bytes32', 'bytes32', 'uint256'],
        log.data
      );

      return ilk === parameters[0];
    };

    const handler = provideEventCheckerHandler(
      () => {
        return {} as Finding;
      },
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
      findings.push(createStaleSpotFinding(SPOT_ADDRESS, strategy));
    }

    timeTracker.updateHour(timestamp);
    return findings;
  }

  return findings;
};

export const provideHandleTransaction = (
  web3: Web3,
  fetcher: MakerFetcher
): HandleTransaction => {
  const timeTracker = new TimeTracker();
  return async (txEvent: TransactionEvent) => {
    const makers = await fetcher.getActiveMakers(txEvent.blockNumber);

    const findings = [
      ...(await provideStabilityFeeHandler(web3, makers, txEvent)),
      ...(await provideStaleSpotPriceHandler(
        web3,
        makers,
        txEvent,
        timeTracker
      )),
    ];

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(web3, fetcher),
  provideHandleTransaction,
};
