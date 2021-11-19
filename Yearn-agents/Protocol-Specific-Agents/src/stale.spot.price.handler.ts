import { TransactionEvent, Finding, Log } from 'forta-agent';
import {
  decodeParameters,
  provideEventCheckerHandler,
} from 'forta-agent-tools';
import Web3 from 'web3';
import TimeTracker from './time.tracker';
import {
  getCollateralType,
  POKE_SIGNATURE,
  SPOT_ADDRESS,
  createStaleSpotFinding,
} from './utils';

// The Handler that checks poke() method is not called for >= 3 hours
const provideStaleSpotPriceHandler = async (
  web3: Web3,
  makers: string[],
  txEvent: TransactionEvent,
  timeTracker: TimeTracker
): Promise<Finding[]> => {
  const findings: Finding[] = [];
  const promises: any = [];
  const timestamp = txEvent.block.timestamp;

  makers.forEach((strategy) => {
    promises.push(
      getCollateralType(web3, strategy, txEvent.blockNumber).then((res) => {
        return {
          strategy: strategy,
          ilk: res,
        };
      })
    );
  });

  const collaterals: any = await Promise.all(promises);

  for (const res of collaterals) {
    const filterEvents = (log: Log) => {
      const parameters = decodeParameters(
        ['bytes32', 'bytes32', 'uint256'],
        log.data
      );

      return res.ilk === parameters[0];
    };

    const handler = provideEventCheckerHandler(
      () => {
        return {} as Finding;
      },
      POKE_SIGNATURE,
      SPOT_ADDRESS,
      filterEvents
    );

    if (
      txEvent.status &&
      (await handler(txEvent)).length !== 0 &&
      timeTracker.isIn3Hours(res.strategy, timestamp)
    ) {
      timeTracker.updateFunctionWasCalled(true);
      timeTracker.updatelastCall(res.strategy, timestamp);
    }

    if (
      !timeTracker.isIn3Hours(res.strategy, timestamp) &&
      !timeTracker.isFirstHour(timestamp)
    ) {
      timeTracker.updateFindingReport(true);
      findings.push(createStaleSpotFinding(SPOT_ADDRESS, res.strategy));
    }
  }

  timeTracker.updateHour(timestamp);
  return findings;
};

export default provideStaleSpotPriceHandler;
