import { 
  BlockEvent, 
  Finding, 
  HandleBlock, 
  getEthersProvider,
} from 'forta-agent'
import {
  Provider,
  getYearnVaults,
  getTotalAssets,
  getDepositLimit,
  createFinding,
  shouldReport,
  LastBlockReports,
} from "./utils";

export const provideHandlerBlock = (ethersProvider: Provider): HandleBlock => {
  const lastBlockReports: LastBlockReports = {};
  let lastBlockAnalyzed = 0;

  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    if (blockEvent.blockNumber < lastBlockAnalyzed) return [];

    lastBlockAnalyzed = blockEvent.blockNumber;

    const findings: Finding[] = [];

    const vaults = await getYearnVaults(blockEvent.blockNumber, ethersProvider); 
    const totalAssetsPromises = vaults.map((vault: string) => getTotalAssets(vault, blockEvent.blockNumber, ethersProvider));
    const depositLimitPromises = vaults.map((vault: string) => getDepositLimit(vault, blockEvent.blockNumber, ethersProvider));

    const totalAssets = await Promise.all(totalAssetsPromises);
    const depositLimits = await Promise.all(depositLimitPromises);

    for (let i = 0; i < vaults.length; i++) {
      if (depositLimits[i].eq(0)) {
        continue;
      }
      
      const utilizationPercent = totalAssets[i].mul(100).div(depositLimits[i]);

      if (shouldReport(vaults[i], utilizationPercent, lastBlockReports, blockEvent.blockNumber)) {
        findings.push(createFinding(vaults[i], depositLimits[i].toString(), totalAssets[i].toString()));
      }
    }

    return findings;
  };
};

export default {
  handleBlock: provideHandlerBlock(getEthersProvider()),
};
