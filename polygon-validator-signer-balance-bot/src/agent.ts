import { Finding, getEthersProvider, ethers, BlockEvent, HandleBlock } from "forta-agent";
import { MINIMUM_THRESHOLD, POLYGON_VALIDATOR_SIGNER_ADDRESS } from "./constants";
import { createOverThresholdFinding, createUnderThresholdFinding } from "./findings";

const ethersProvider = getEthersProvider();
let alertSent: boolean = false;

export function provideHandleTransaction(ethersProvider: ethers.providers.JsonRpcProvider): HandleBlock {
  return async (txEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const formatThresholdToBigNumber = ethers.BigNumber.from(MINIMUM_THRESHOLD);
    const accountBalance = await ethersProvider.getBalance(POLYGON_VALIDATOR_SIGNER_ADDRESS, txEvent.blockNumber - 1);
    const formatBalance = accountBalance?.toString();
    if (accountBalance.lt(formatThresholdToBigNumber) && !alertSent) {
      findings.push(createUnderThresholdFinding(formatBalance));
      alertSent = true;
    } else if (accountBalance.gt(formatThresholdToBigNumber) && !alertSent) {
      findings.push(createOverThresholdFinding(formatBalance));
      alertSent = true;
    }
    return findings;
  };
}

export default {
  handleBlock: provideHandleTransaction(ethersProvider),
};
