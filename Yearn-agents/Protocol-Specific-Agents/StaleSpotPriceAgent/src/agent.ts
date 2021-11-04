import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  getJsonRpcUrl,
} from 'forta-agent';
import Web3 from 'web3';
import MakerFetcher from './maker.fetcher';
import {
  provideEventCheckerHandler,
  provideFunctionCallsDetectorHandler,
} from 'forta-agent-tools';
import TimeTracker from './time.tracker';
import { createFinding, getCollateralType } from './utils';

const web3: Web3 = new Web3(getJsonRpcUrl());
const fetcher = new MakerFetcher(web3);

const address = '0x65C79fcB50Ca1594B025960e539eD7A9a6D434A3';
const functionSignature = 'Poke(bytes32,bytes32,uint256)';

export const providehandleTransaction = (web3: Web3): HandleTransaction => {
  const timeTracker = new TimeTracker();

  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const timestamp = txEvent.block.timestamp;

    const makers = await fetcher.getActiveMakers(txEvent.blockNumber);

    for (const strategy of makers) {
      const collateralType = await getCollateralType(
        web3,
        strategy,
        txEvent.blockNumber
      );

      const filterOnArguments = (args: { [key: string]: any }): boolean => {
        return args[0] === collateralType;
      };

      const handler = provideEventCheckerHandler(
        () => {
          return {} as Finding;
        },
        functionSignature,
        address,
        filterOnArguments
      );

      if (
        (await handler(txEvent)).length !== 0 &&
        timeTracker.isIn3Hours(timestamp)
      ) {
        timeTracker.updateFunctionWasCalled(true);
      }

      if (
        !timeTracker.isIn3Hours(timestamp) &&
        !timeTracker.functionWasCalled &&
        !timeTracker.findingReported
      ) {
        timeTracker.updateFindingReport(true);
        findings.push(createFinding());
      }

      timeTracker.updateHour(timestamp);
    }

    return findings;
  };
};
export default {
  handleTransaction: providehandleTransaction(web3),
  providehandleTransaction,
};
