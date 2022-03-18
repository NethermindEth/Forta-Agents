import { BigNumber } from "ethers";
import { findingCase, createFinding } from "./findings";
import { BlockEvent, Finding, HandleBlock, getEthersProvider } from "forta-agent";
import { QiTOKENS, BORROW_RATE_THRESHOLDS, SUPPLY_RATE_THRESHOLDS } from "./utils";
import Fetcher from "./fetcher";

export const provideHandleBlock =
  (
    fetcher: Fetcher,
    qiTokens: string[][], //QiTokens names & addresses
    borrowRateThresholds: BigNumber[][], //Lower & upper borrow rate thresholds
    supplyRateThresholds: BigNumber[][] //Lower & upper supply rate thresholds
  ): HandleBlock =>
  async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const block: number = blockEvent.blockNumber;

    //Fetch and store supply and borrow interest rates for every Qi token
    const qiTokenSupplyInterestRate: BigNumber[] = await Promise.all(
      qiTokens.map((qiToken) => fetcher.getSupplyInterestRates(block, qiToken[1]))
    );
    const qiTokenBorrowInterestRate: BigNumber[] = await Promise.all(
      qiTokens.map((qiToken) => fetcher.getBorrowInterestRates(block, qiToken[1]))
    );

    //Check conditions to create finding
    qiTokenSupplyInterestRate.forEach((supplyRate, i) => {
      if (supplyRate.lt(supplyRateThresholds[i][0])) {
        findings.push(
          createFinding(qiTokens[i][0], qiTokens[i][1], supplyRate, supplyRateThresholds[i][0], findingCase[2])
        );
      } else if (supplyRate.gt(supplyRateThresholds[i][1])) {
        findings.push(
          createFinding(qiTokens[i][0], qiTokens[i][1], supplyRate, supplyRateThresholds[i][1], findingCase[3])
        );
      }
    });

    qiTokenBorrowInterestRate.forEach((borrowRate, i) => {
      if (borrowRate.lt(borrowRateThresholds[i][0])) {
        findings.push(
          createFinding(qiTokens[i][0], qiTokens[i][1], borrowRate, borrowRateThresholds[i][0], findingCase[0])
        );
      } else if (borrowRate.gt(borrowRateThresholds[i][1])) {
        findings.push(
          createFinding(qiTokens[i][0], qiTokens[i][1], borrowRate, borrowRateThresholds[i][1], findingCase[1])
        );
      }
    });

    return findings;
  };

export default {
  handleBlock: provideHandleBlock(
    new Fetcher(getEthersProvider()),
    QiTOKENS,
    BORROW_RATE_THRESHOLDS,
    SUPPLY_RATE_THRESHOLDS
  ),
};
