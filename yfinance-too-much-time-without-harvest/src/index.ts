import {
  BlockEvent,
  Finding,
  HandleBlock,
  getJsonRpcUrl,
  Block,
} from "forta-agent";
import Web3 from "web3";
import { StrategyParams } from "./abi.utils";
import {
  createFinding,
  getVaultAddress,
  getStrategyParams,
  getMaxReportDelay,
} from "./agent.utils";

const web3: Web3 = new Web3(getJsonRpcUrl());

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
