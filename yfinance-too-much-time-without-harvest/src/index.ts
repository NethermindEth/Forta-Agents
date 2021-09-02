import BigNumber from "bignumber.js";
import {
  BlockEvent,
  Finding,
  HandleBlock,
  FindingSeverity,
  FindingType,
  getJsonRpcUrl,
  Block,
} from "forta-agent";
import Web3 from "web3";
import {
  decodeReturnStrategies,
  createTxDataStrategiesCall,
  createTxDataVaultCall,
  createTxDataMaxReportDelayCall,
  StrategyParams,
} from "./abi.utils";

const web3: Web3 = new Web3(getJsonRpcUrl());

export const createFinding = (strategyToReport: string): Finding => {
  return Finding.fromObject({
    name: "Yearn Finance no harvested strategies",
    alertId: "NETHFORTA-22",
    description:
      "A yearn finance strategy have been too much time without trigerring harvest",
    severity: FindingSeverity.Info,
    type: FindingType.Suspicious,
    metadata: {
      Strategy: strategyToReport,
    },
  });
};

const getVaultAddress = async (
  strategyAddress: string,
  web3: Web3
): Promise<string> => {
  const returnValueVaultCall: string = await web3.eth.call({
    to: strategyAddress,
    data: createTxDataVaultCall(),
  });
  return web3.eth.abi.decodeParameter("address", returnValueVaultCall) as any;
};

const getStrategyParams = async (
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

const getMaxReportDelay = async (
  strategyAddress: string,
  web3: Web3
): Promise<bigint> => {
  const returnValueMaxReportDelay = await web3.eth.call({
    to: strategyAddress,
    data: createTxDataMaxReportDelayCall(),
  });
  return BigInt(web3.eth.abi.decodeParameter(
    "uint256",
    returnValueMaxReportDelay
  ) as any);
};

const checkStrategyInBlock = async (
  strategyAddress: string,
  block: Block,
  web3: Web3
): Promise<Finding[]> => {
  const findings: Finding[] = [];

  const vaultAddress: string = await getVaultAddress(strategyAddress, web3);
  const strategyParams: StrategyParams = await getStrategyParams(
    vaultAddress,
    strategyAddress,
    web3
  );

  const lastReport: bigint = BigInt(strategyParams.lastReport);
  const maxReportDelay: bigint = await getMaxReportDelay(strategyAddress, web3);
  const actualTimestamp: bigint = BigInt(block.timestamp);

  if (actualTimestamp - lastReport > maxReportDelay) {
    findings.push(createFinding(strategyAddress));
  }

  return findings;
};

export const provideHandleBlock = (
  web3: Web3,
  strategiesToCheck: string[]
): HandleBlock => {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];
    for (let i = 0; i < strategiesToCheck.length; i++) {
      const newFindings: Finding[] = await checkStrategyInBlock(
        strategiesToCheck[i],
        blockEvent.block,
        web3
      );
      findings = findings.concat(newFindings);
    }
    return findings;
  };
};

export default {
  handleBlock: provideHandleBlock(web3, []),
};
