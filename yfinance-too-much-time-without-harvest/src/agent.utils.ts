import { Finding, FindingSeverity, FindingType } from "forta-agent";
import {
  decodeReturnStrategies,
  createTxDataStrategiesCall,
  createTxDataVaultCall,
  createTxDataMaxReportDelayCall,
  StrategyParams,
} from "./abi.utils";
import Web3 from "web3";

export const createFinding = (strategyToReport: string): Finding => {
  return Finding.fromObject({
    name: "Yearn Finance no harvested strategies",
    alertId: "NETHFORTA-21",
    description:
      "A yearn finance strategy have been too much time without trigerring harvest",
    severity: FindingSeverity.Info,
    type: FindingType.Suspicious,
    metadata: {
      Strategy: strategyToReport,
    },
  });
};

export const getVaultAddress = async (
  strategyAddress: string,
  web3: Web3
): Promise<string> => {
  const returnValueVaultCall: string = await web3.eth.call({
    to: strategyAddress,
    data: createTxDataVaultCall(),
  });
  return web3.eth.abi.decodeParameter("address", returnValueVaultCall) as any;
};

export const getStrategyParams = async (
  vaultAddress: string,
  strategyAddress: string,
  web3: Web3
): Promise<StrategyParams> => {
  const returnValueStrategies: string = await web3.eth.call({
    to: vaultAddress,
    data: createTxDataStrategiesCall(strategyAddress),
  });
  return decodeReturnStrategies(returnValueStrategies);
};

export const getMaxReportDelay = async (
  strategyAddress: string,
  web3: Web3
): Promise<bigint> => {
  const returnValueMaxReportDelay = await web3.eth.call({
    to: strategyAddress,
    data: createTxDataMaxReportDelayCall(),
  });
  return BigInt(
    web3.eth.abi.decodeParameter("uint256", returnValueMaxReportDelay) as any
  );
};
