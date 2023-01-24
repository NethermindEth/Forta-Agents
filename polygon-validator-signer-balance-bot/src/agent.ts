import { Finding, getEthersProvider, ethers, BlockEvent, HandleBlock, Initialize } from "forta-agent";
import { MINIMUM_THRESHOLD, POLYGON_VALIDATOR_SIGNER_ADDRESS, Flag } from "./constants";
import { createOverThresholdFinding, createUnderThresholdFinding } from "./findings";

const ethersProvider = getEthersProvider();
let flag = {
  wasOverThresholdAlert: false,
};

export const provideInitialize = (ethersProvider: ethers.providers.JsonRpcProvider, flag: Flag): Initialize => {
  return async () => {
    const accountBalance = await ethersProvider.getBalance(POLYGON_VALIDATOR_SIGNER_ADDRESS);
    if (accountBalance?.gt(MINIMUM_THRESHOLD)) {
      flag.wasOverThresholdAlert = true;
    } else {
      flag.wasOverThresholdAlert = false;
    }
  };
};

export function provideHandleBlock(ethersProvider: ethers.providers.JsonRpcProvider, flag: Flag): HandleBlock {
  return async (txEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const accountBalance = await ethersProvider.getBalance(POLYGON_VALIDATOR_SIGNER_ADDRESS, txEvent.blockNumber - 1);
    const formatBalance = accountBalance?.toString();
    if (accountBalance.lt(MINIMUM_THRESHOLD) && flag.wasOverThresholdAlert) {
      findings.push(createUnderThresholdFinding(formatBalance));
      flag.wasOverThresholdAlert = false;
    } else if (accountBalance.gt(MINIMUM_THRESHOLD) && !flag.wasOverThresholdAlert) {
      findings.push(createOverThresholdFinding(formatBalance));
      flag.wasOverThresholdAlert = true;
    }
    return findings;
  };
}

export default {
  initialize: provideInitialize(ethersProvider, flag),
  handleBlock: provideHandleBlock(ethersProvider, flag),
};
