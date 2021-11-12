import {
  Finding,
  TransactionEvent,
  getJsonRpcUrl,
  Log,
  HandleTransaction,
  HandleBlock,
  BlockEvent,
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
  checkOSMContracts,
  createFindingStabilityFee,
  createOSMPriceFinding,
  createStaleSpotFinding,
  decodeNumber,
  getCollateralType,
  JUG_CONTRACT,
  JUG_DRIP_FUNCTION_SIGNATURE,
  OSM_CONTRACTS,
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
  const promises: any = [];

  if (!txEvent.status) return [];

  makers.forEach((strategy) => {
    promises.push(
      getCollateralType(web3, strategy, txEvent.blockNumber).then((res) => {
        return {
          strategy: strategy,
          collateralType: res,
        };
      })
    );
  });

  const collaterals: any = (await Promise.all(promises)).flat();

  for (const res of collaterals) {
    const filterOnArguments = (args: { [key: string]: any }): boolean => {
      return args[0] === res.collateralType;
    };

    const agentHandler = provideFunctionCallsDetectorHandler(
      createFindingStabilityFee(res.strategy),
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

  const collaterals: any = (await Promise.all(promises)).flat();

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

    if (!timeTracker.isIn3Hours(res.strategy, timestamp)) {
      timeTracker.updateFindingReport(false);
      timeTracker.updateFunctionWasCalled(false);
    }

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
      !timeTracker.isFirstHour(timestamp) &&
      !timeTracker.functionWasCalled &&
      !timeTracker.findingReported
    ) {
      timeTracker.updateFindingReport(true);
      findings.push(createStaleSpotFinding(SPOT_ADDRESS, res.strategy));
    }
  }

  timeTracker.updateHour(timestamp);
  return findings;
};

// The Handler that checks if OSM contract are returning Price of 0
export const provideOSMPriceHandler = (
  web3: Web3,
  contracts: string[]
): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    let findings: Finding[] = [];
    const promises: any = [];

    contracts.forEach((contract) => {
      promises.push(
        checkOSMContracts(web3, contract, blockEvent.blockNumber).then(
          (res) => {
            return {
              contract: contract,
              peek: res,
            };
          }
        )
      );
    });

    await Promise.all(promises).then((res) => {
      res.forEach((res: any) => {
        const value = decodeNumber(web3, res.peek[0]).toString();
        const isValid = res.peek[1];

        if (value === '0' && !isValid) {
          findings.push(createOSMPriceFinding(res.contract, value.toString()));
        }
      });
    });

    return findings;
  };
};

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

      await Promise.all(handlerCalls).then((res) => {
        findings = findings.concat(...res);
      });
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
