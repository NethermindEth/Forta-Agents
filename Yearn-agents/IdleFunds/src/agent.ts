import {
  BlockEvent,
  Finding,
  HandleBlock,
  getEthersProvider,
} from "forta-agent";
import {
  getYearnVaults,
  getTotalAssets,
  getTotalDebt,
  Provider,
  createFinding,
  computeIdlePercent,
  LastBlockReports,
  shouldReport,
} from "./utils";

export const provideHandlerBlock = (etherProvider: Provider): HandleBlock => {
  const lastBlockReports: LastBlockReports = {};
  let lastBlockAnalyzed: number = 0;

  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    if (blockEvent.blockNumber < lastBlockAnalyzed) return [];

    lastBlockAnalyzed = blockEvent.blockNumber;

    let findings: Finding[] = [];

    const vaults = await getYearnVaults(blockEvent.blockNumber, etherProvider);

    const totalAssetsPromises = vaults.map((vault: string) =>
      getTotalAssets(vault, blockEvent.blockNumber, etherProvider)
    );
    const totalDebtsPromises = vaults.map((vault: string) =>
      getTotalDebt(vault, blockEvent.blockNumber, etherProvider)
    );

    const totalAssets = await Promise.all(totalAssetsPromises);
    const totalDebts = await Promise.all(totalDebtsPromises);

    for (let i = 0; i < vaults.length; i++) {
      if (totalAssets[i].eq(0)) {
        continue;
      }

      const idleFundPercent = computeIdlePercent(totalAssets[i], totalDebts[i]);

      if (
        shouldReport(
          vaults[i],
          idleFundPercent,
          lastBlockReports,
          blockEvent.blockNumber
        )
      ) {
        findings.push(createFinding(vaults[i], idleFundPercent.toString()));
      }
    }

    return findings;
  };
};

export default {
  handleBlock: provideHandlerBlock(getEthersProvider()),
};
