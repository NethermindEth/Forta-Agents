import { ethers } from "forta-agent";

export const POLYGON_VALIDATOR_SIGNER_ADDRESS: string = "0xa8B52F02108AA5F4B675bDcC973760022D7C6020";
export const MINIMUM_THRESHOLD = ethers.BigNumber.from("200000000000000000"); //0.2 ETH
export const MINIMUM_THRESHOLD_TO_ETHER = ethers.utils.formatEther(MINIMUM_THRESHOLD);
export type Flag = {
  wasOverThresholdAlert: boolean;
};

