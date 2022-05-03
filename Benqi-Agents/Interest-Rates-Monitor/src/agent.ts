import { BigNumber } from "ethers";
import { findingCase, createFinding } from "./findings";
import { BlockEvent, Finding, HandleBlock, getEthersProvider } from "forta-agent";
import { QI_TOKENS, POC_QI_TOKENS, testnetMode } from "./utils";
import Fetcher from "./fetcher";

export const provideHandleBlock =
  (
    fetcher: Fetcher,
    qiTokens: [
      name: string,
      address: string,
      lowerSupply: BigNumber,
      upperSupply: BigNumber,
      lowerBorrow: BigNumber,
      lowerBorrow: BigNumber
    ][]
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
      //Lower supply threshold check
      if (supplyRate.lt(qiTokens[i][2])) {
        findings.push(createFinding(qiTokens[i][0], qiTokens[i][1], supplyRate, qiTokens[i][2], findingCase[0]));
      } //Upper supply threshold check
      else if (supplyRate.gt(qiTokens[i][3])) {
        findings.push(createFinding(qiTokens[i][0], qiTokens[i][1], supplyRate, qiTokens[i][3], findingCase[1]));
      }
    });

    qiTokenBorrowInterestRate.forEach((borrowRate, i) => {
      //Lower borrow threshold check
      if (borrowRate.lt(qiTokens[i][4])) {
        findings.push(createFinding(qiTokens[i][0], qiTokens[i][1], borrowRate, qiTokens[i][4], findingCase[2]));
      } //Upper borrow threshold check
      else if (borrowRate.gt(qiTokens[i][5])) {
        findings.push(createFinding(qiTokens[i][0], qiTokens[i][1], borrowRate, qiTokens[i][5], findingCase[3]));
      }
    });

    return findings;
  };

export default {
  handleBlock: provideHandleBlock(new Fetcher(getEthersProvider()), testnetMode ? POC_QI_TOKENS : QI_TOKENS),
};
