import { BlockEvent, Finding, HandleBlock, FindingSeverity, FindingType, getEthersProvider } from "forta-agent";
import DataFetcher from "./data.fetcher";

const FLEXA_CONTRACT_ADDRESS = "0x706d7f8b3445d8dfc790c524e3990ef014e7c578";
const FETCHER: DataFetcher = new DataFetcher(FLEXA_CONTRACT_ADDRESS, getEthersProvider());

export const provideHandleBlock = (fetcher: DataFetcher): HandleBlock => {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const fallbackSetDate = await fetcher.getFallbackSetDate(blockEvent.blockNumber);
    const fallbackWithdrawalDelaySeconds = await fetcher.getFallbackWithdrawalDelaySeconds(blockEvent.blockNumber);

    // Check if contract is in fallback state
    // Contract enters fallback state if (fallbackSetDate + fallbackWithdrawalDelaySeconds <= block.timestamp)
    if (fallbackSetDate.add(fallbackWithdrawalDelaySeconds).lte(blockEvent.block.timestamp)) {
      // Check if the contract was not in fallback state in the previous block. if it was, it'd be a reccurring finding.
      const previousBlockTimestamp = await fetcher.getBlockTimestamp(blockEvent.blockNumber - 1);
      const previousFallbackSetDate = await fetcher.getFallbackSetDate(blockEvent.blockNumber - 1);
      const previousFallbackWithdrawalDelaySeconds = await fetcher.getFallbackWithdrawalDelaySeconds(
        blockEvent.blockNumber - 1
      );

      if (previousFallbackSetDate.add(previousFallbackWithdrawalDelaySeconds).gt(previousBlockTimestamp)) {
        findings.push(
          Finding.fromObject({
            name: "Contract Fallback State alert",
            description: "Contract has entered fallback mode",
            alertId: "FLEXA-5",
            severity: FindingSeverity.Info,
            type: FindingType.Info,
            protocol: "Flexa"
          })
        );
      }
    }

    return findings;
  };
};

export default {
  handleBlock: provideHandleBlock(FETCHER)
};
