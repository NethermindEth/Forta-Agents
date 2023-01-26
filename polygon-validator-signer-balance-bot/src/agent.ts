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
  address: string
): Initialize => {
  return async () => {
    const accountBalance = await ethersProvider.getBalance(address);
    if (accountBalance.gt(MINIMUM_THRESHOLD)) {
      flag.wasOverThresholdAlert = true;
    } else {
      flag.wasOverThresholdAlert = false;
    }
  };
};

export function provideHandleBlock(
  ethersProvider: ethers.providers.JsonRpcProvider,
  flag: Flag,
  address: string
): HandleBlock {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const accountBalance = await ethersProvider.getBalance(address, blockEvent.blockNumber - 1);
    const balanceString = ethers.utils.formatEther(accountBalance.toString());
    if (accountBalance.lt(MINIMUM_THRESHOLD) && flag.wasOverThresholdAlert) {
      findings.push(createUnderThresholdFinding(balanceString));
      flag.wasOverThresholdAlert = false;
    } else if (accountBalance.gt(MINIMUM_THRESHOLD) && !flag.wasOverThresholdAlert) {
      findings.push(createOverThresholdFinding(balanceString));
      flag.wasOverThresholdAlert = true;
    }
    return findings;
  };
}

export default {
  initialize: provideInitialize(ethersProvider, flag, POLYGON_VALIDATOR_SIGNER_ADDRESS),
  handleBlock: provideHandleBlock(ethersProvider, flag, POLYGON_VALIDATOR_SIGNER_ADDRESS),
};
