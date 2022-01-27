import {
  BlockEvent,
  Finding,
  getEthersProvider,
  getJsonRpcUrl,
} from "forta-agent";
import {
  getBiggerInvestors,
  getVaults,
  createFinding,
  getStatsForVault,
  getForkProvider,
} from "./utils";
import { providers } from "ethers";

const VAULTS_REGISTRY = "0x437758D475F70249e03EDa6bE23684aD1FC375F0";
const FINDINGS_PACKS: Finding[][] = [];
const REPORT_PERIOD = 6 * 60 * 60; // 6 hours
let lastReported = 0;

const detectFindings = async (
  registryAddress: string,
  jsonRpcURL: string,
  provider: providers.Provider,
  outFindingsPacks: Finding[][]
) => {
  while (true) {
    try {
      const blockNumber = await provider.getBlockNumber();
      const vaults = await getVaults(registryAddress, blockNumber, provider);

      const investByVaultPromises = vaults.map((vault) =>
        getBiggerInvestors(vault)
      );
      let investByVault = await Promise.all(investByVaultPromises);

      investByVault = investByVault.filter(
        (investorsInfo) => investorsInfo.length > 0
      );

      const statsPromises = investByVault.map((investors) =>
        getStatsForVault(investors, jsonRpcURL, blockNumber, getForkProvider)
      );

      const findings = (await Promise.all(statsPromises)).map(
        ([vault, totalSupply, totalInvestorValues, ableToWithdrawn]) =>
          createFinding(
            vault,
            totalSupply,
            totalInvestorValues,
            ableToWithdrawn
          )
      );

      outFindingsPacks.push(findings);
    } catch {}
  }
};

const initialize = () => {
  detectFindings(
    VAULTS_REGISTRY,
    getJsonRpcUrl(),
    getEthersProvider(),
    FINDINGS_PACKS
  );
};

const handleBlock = async (blockEvent: BlockEvent): Promise<Finding[]> => {
  if (blockEvent.block.timestamp - lastReported >= REPORT_PERIOD) {
    if (FINDINGS_PACKS.length > 0) {
      const findings = FINDINGS_PACKS[FINDINGS_PACKS.length - 1];
      FINDINGS_PACKS.splice(0, FINDINGS_PACKS.length);
      lastReported = blockEvent.block.timestamp;
      return findings;
    }
  }
  return [];
};

export default {
  handleBlock,
  initialize,
};
