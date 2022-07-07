import { ethers } from "forta-agent";
export const BN = ethers.BigNumber;

export const DECIMALS = BN.from(10).pow(18);
export const HIGH_THRESHOLD = BN.from(50).mul(DECIMALS);
export const MEDIUM_THRESHOLD = BN.from(25).mul(DECIMALS);
export const LOW_THRESHOLD = BN.from(10).mul(DECIMALS);
