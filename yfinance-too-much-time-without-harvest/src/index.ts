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
const INTERESTING_STRATEGIES = [
  // DAI Vault Strategies
  "0xc8f17f8e15900b6d6079680b15da3ce5263f62aa",
  "0x6341c289b2e0795a04223df04b53a77970958723",
  "0xa6d1c610b3000f143c18c75d84baa0ec22681185",
  // ETH Vault Strategies
  "0x83b6211379c26e0ba8d01b9ecd4ee1ae915630aa",
  "0xd28b508ea08f14a473a5f332631ea1972cfd7cc0",
  "0xf9fdc2b5f60355a237deb8bd62cc117b1c907f7b",
  "0x0967afe627c732d152e3dfcadd6f9dbfecde18c3",
]

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
  handleBlock: provideHandleBlock(web3, INTERESTING_STRATEGIES),
};
