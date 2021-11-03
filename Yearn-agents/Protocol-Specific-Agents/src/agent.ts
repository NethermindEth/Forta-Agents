import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  getJsonRpcUrl,
} from 'forta-agent';
import { provideFunctionCallsDetectorHandler } from 'forta-agent-tools';
import Web3 from 'web3';
import MakerFetcher from './maker.fetcher';
import {
  createFindingStabilityFee,
  getCollateralType,
  JUG_CONTRACT,
  JUG_DRIP_FUNCTION_SIGNATURE,
} from './utils';

const web3: Web3 = new Web3(getJsonRpcUrl());

export const provideHandleTransaction = (web3: Web3) => {
  return async (txEvent: TransactionEvent) => {
    const fetcher = new MakerFetcher(web3);

    const findings: Finding[] = [];

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

      const agentHandler = provideFunctionCallsDetectorHandler(
        createFindingStabilityFee(strategy),
        JUG_DRIP_FUNCTION_SIGNATURE,
        { to: JUG_CONTRACT, filterOnArguments }
      );

      findings.push(...(await agentHandler(txEvent)));
    }

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(web3),
  provideHandleTransaction,
};
