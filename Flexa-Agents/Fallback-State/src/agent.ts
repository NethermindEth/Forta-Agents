import { BlockEvent, Finding, HandleBlock, FindingSeverity, FindingType, getEthersProvider } from "forta-agent";

import DataFetcher from "./data.fetcher";

const FLEXA_CONTRACT_ADDRESS = "0x706d7f8b3445d8dfc790c524e3990ef014e7c578";
const FETCHER: DataFetcher = new DataFetcher(FLEXA_CONTRACT_ADDRESS, getEthersProvider());

export const provideHandleBlock = (fetcher: DataFetcher, flexaContractAddress: string): HandleBlock => {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const previousBlockTimestamp = (await getEthersProvider().getBlock(blockEvent.blockNumber - 1)).timestamp;

    const fallbackSetDate = await fetcher.getFallbackSetDate(blockEvent.blockNumber, flexaContractAddress);
    const fallbackWithdrawalDelaySeconds = await fetcher.getFallbackWithdrawalDelaySeconds(
      blockEvent.blockNumber,
      flexaContractAddress
    );
    const previousFallbackSetDate = await fetcher.getFallbackSetDate(blockEvent.blockNumber - 1, flexaContractAddress);
    const previousFallbackWithdrawalDelaySeconds = await fetcher.getFallbackWithdrawalDelaySeconds(
      blockEvent.blockNumber - 1,
      flexaContractAddress
    );

    // Check if contract is in fallback state
    // Contract enters fallback state if (fallbackSetDate + fallbackWithdrawalDelaySeconds <= block.timestamp)
    if (fallbackSetDate + fallbackWithdrawalDelaySeconds <= blockEvent.block.timestamp) {
      // Check if the contract was not in fallback state in the previous block. if it was, it'd be a reccurring finding.
      if (previousFallbackSetDate + previousFallbackWithdrawalDelaySeconds > previousBlockTimestamp) {
        findings.push(
          Finding.fromObject({
            name: "Contract Fallback State alert",
            description: "Contract has entered fallback mode",
            alertId: "FLEXA-4",
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
  handleBlock: provideHandleBlock(FETCHER, FLEXA_CONTRACT_ADDRESS)
};
