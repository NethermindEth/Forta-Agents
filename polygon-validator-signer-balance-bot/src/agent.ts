import { Finding, getEthersProvider, ethers, BlockEvent, HandleBlock, Initialize } from "forta-agent";
import { MINIMUM_THRESHOLD, POLYGON_VALIDATOR_SIGNER_ADDRESS, Flag } from "./constants";
import { createOverThresholdFinding, createUnderThresholdFinding } from "./findings";

const ethersProvider = getEthersProvider();
let flag = {
  wasOverThresholdAlert: false,
};

export const provideInitialize = (
  ethersProvider: ethers.providers.JsonRpcProvider,
  flag: Flag,
  address: string,
  threshold: ethers.BigNumber
): Initialize => {
  return async () => {
    const accountBalance = await ethersProvider.getBalance(address);
    if (accountBalance.gt(threshold)) {
      flag.wasOverThresholdAlert = true;
    } else {
      flag.wasOverThresholdAlert = false;
    }
  };
};

export function provideHandleBlock(
  ethersProvider: ethers.providers.JsonRpcProvider,
  flag: Flag,
  address: string,
  threshold: ethers.BigNumber
): HandleBlock {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const accountBalance = await ethersProvider.getBalance(address, blockEvent.blockNumber - 1);
    if (accountBalance.lt(threshold) && flag.wasOverThresholdAlert) {
      const balanceString = ethers.utils.formatEther(accountBalance.toString());
      findings.push(createUnderThresholdFinding(balanceString));
      flag.wasOverThresholdAlert = false;
    } else if (accountBalance.gt(threshold) && !flag.wasOverThresholdAlert) {
      const balanceString = ethers.utils.formatEther(accountBalance.toString());
      findings.push(createOverThresholdFinding(balanceString));
      flag.wasOverThresholdAlert = true;
    }
    return findings;
  };
}

export default {
  initialize: provideInitialize(ethersProvider, flag, POLYGON_VALIDATOR_SIGNER_ADDRESS, MINIMUM_THRESHOLD),
  handleBlock: provideHandleBlock(ethersProvider, flag, POLYGON_VALIDATOR_SIGNER_ADDRESS, MINIMUM_THRESHOLD),
};
