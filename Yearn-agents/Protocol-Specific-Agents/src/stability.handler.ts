import { TransactionEvent, Finding } from 'forta-agent';
import { provideFunctionCallsDetectorHandler } from 'forta-agent-tools';
import Web3 from 'web3';
import {
  getCollateralType,
  createFindingStabilityFee,
  JUG_DRIP_FUNCTION_SIGNATURE,
  JUG_CONTRACT,
} from './utils';

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

  const collaterals: any = await Promise.all(promises);

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

export default provideStabilityFeeHandler;
