import { ethers } from "forta-agent";
export const BN = ethers.BigNumber;

export const DECIMALS = BN.from(10).pow(18);

export const MIN_PREVIOUS_BALANCE = BN.from(1).mul(DECIMALS);
export const HIGH_THRESHOLD = 1; //100%
export const MEDIUM_THRESHOLD = 0.5; //50%
export const LOW_THRESHOLD = 0.25; //25%
