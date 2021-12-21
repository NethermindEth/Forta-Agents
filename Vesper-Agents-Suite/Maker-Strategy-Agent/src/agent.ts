import Web3 from "web3";
import { getJsonRpcUrl, TransactionEvent } from "forta-agent";
import { BlockEvent, Finding, HandleBlock } from "forta-agent";
import {
  checkIsUnderWaterTrue,
  createFindingHighWater,
  createFindingIsUnderWater,
  createFindingLowWater,
  createFindingStabilityFee,
  getCollateralRatio,
  getLowWater,
  getHighWater,
  getCollateralType,
  JUG_DRIP_FUNCTION_SIGNATURE,
  JUG_CONTRACT
} from "./utils";
import { provideFunctionCallsDetectorHandler } from "forta-agent-tools";
import MakerFetcher from "./maker.fetcher";

const web3: Web3 = new Web3(getJsonRpcUrl());

export const provideMakerStrategyHandler = (web3: Web3): HandleBlock => {
  const fetcher = new MakerFetcher(web3);

  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const promises: any = [];

    const makers = await fetcher.getMakerStrategies(blockEvent.blockNumber);

    if (makers) {
      makers.forEach((strategy) => {
        promises.push(
          getCollateralRatio(web3, strategy, blockEvent.blockNumber).then(
            (res) => {
              return {
                strategy: strategy,
                collateralRatio: res.collateralRatio
              };
            }
          )
        );
      });

      const collaterals: any = (await Promise.all(promises)).flat();

      for (let res of collaterals) {
        const lowWater: Promise<number> = getLowWater(
          web3,
          res.strategy,
          blockEvent.blockNumber
        );
        
         /* Commented to stop alert.
        const highWater: Promise<number> = getHighWater(
          web3,
          res.strategy,
          blockEvent.blockNumber
        );
        const isUnderWater: Promise<boolean> = checkIsUnderWaterTrue(
          web3,
          res.strategy,
          blockEvent.blockNumber
        );
        */

        await Promise.all([lowWater]).then(
          (values) => {
            const collateralRatio = res.collateralRatio;
            const lowWater = values[0];
            /* Commented to stop alert.
            const highWater = values[1];
            const isUnderWater = values[2];
            if (isUnderWater) {
              findings.push(createFindingIsUnderWater(res.strategy.toString()));
            }
            */
            if (BigInt(collateralRatio) < BigInt(lowWater)) {
              findings.push(
                createFindingLowWater(
                  res.strategy.toString(),
                  collateralRatio,
                  lowWater.toString()
                )
              );
            } 
            /* Commented to stop alert.
            else if (BigInt(collateralRatio) > BigInt(highWater))
              findings.push(
                createFindingHighWater(
                  res.strategy.toString(),
                  collateralRatio,
                  highWater.toString()
                )
              );
              */
          }
        );
      }
    }

    return findings;
  };
};

export const provideHandleTransaction = (web3: Web3) => {
  const fetcher = new MakerFetcher(web3);

  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const promises: any = [];

    if (!txEvent.status) return [];

    const makers = await fetcher.getMakerStrategies(txEvent.blockNumber);

    if (makers) {
      makers.forEach((strategy) => {
        promises.push(
          getCollateralType(web3, strategy, txEvent.blockNumber).then((res) => {
            return {
              strategy: strategy,
              collateralType: res
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
          createFindingStabilityFee(res.strategy.toString()),
          JUG_DRIP_FUNCTION_SIGNATURE,
          { to: JUG_CONTRACT, filterOnArguments }
        );

        findings.push(...(await agentHandler(txEvent)));
      }
    }

    return findings;
  };
};

export default {
  handleBlock: provideMakerStrategyHandler(web3),
  handleTransaction: provideHandleTransaction(web3),
  provideMakerStrategyHandler,
  provideHandleTransaction
};
