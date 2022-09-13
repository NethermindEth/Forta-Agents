import { BlockEvent, Finding, getEthersProvider, HandleBlock } from "forta-agent";
import { BigNumber } from "ethers";
import DataFetcher from "./data.fetcher";
import { createFinding } from "./utils";
import axios from "axios";

const FETCHER: DataFetcher = new DataFetcher(getEthersProvider(), axios);
const VAULTS_REGISTRY = "0x437758D475F70249e03EDa6bE23684aD1FC375F0";
const FINDINGS_PACKS: Finding[][] = [];
const REPORT_PERIOD = 6 * 60 * 60; // 6 hours

const detectFindings = async (
  registryAddress: string,
  fetcher: DataFetcher,
  outFindingsPacks: Finding[][]
) => {
  while (true) {
    try {
      const stats: [string, BigNumber, BigNumber, BigNumber][] = await fetcher.getStats(
        registryAddress
      );

      const findings = stats.map(
        ([vault, totalSupply, totalInvestorValues, ableToWithdrawn]) =>
          createFinding(vault, totalSupply, totalInvestorValues, ableToWithdrawn)
      );

      outFindingsPacks.push(findings);
    } catch {}
  }
};

const initialize = () => {
  detectFindings(VAULTS_REGISTRY, FETCHER, FINDINGS_PACKS);
};

export const provideHandleBlock =
  (period: number, findings: Finding[][], lastReported: number): HandleBlock =>
  async (blockEvent: BlockEvent): Promise<Finding[]> => {
    if (blockEvent.block.timestamp - lastReported >= period && findings.length > 0) {
      const _findings = findings[findings.length - 1];
      findings.splice(0, findings.length);
      lastReported = blockEvent.block.timestamp;
      return _findings;
    }
    return [];
  };

export default {
  handleBlock: provideHandleBlock(REPORT_PERIOD, FINDINGS_PACKS, 0),
  initialize,
};
